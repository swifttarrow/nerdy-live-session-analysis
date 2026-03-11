"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Room } from "livekit-client";
import { connectToRoom, disconnectRoom } from "@/lib/livekit/room";
import { createFrameSampler } from "@video-processor/frame-sampler";
import {
  createVideoPipeline,
  type VideoPipeline,
  type VideoQualityState,
} from "@video-processor/pipeline";
import {
  createAudioPipeline,
  createMetricsAggregator,
  createInterruptionTracker,
  classifyInterruptionsWithContent,
  createResponseLatencyTracker,
  createMonologueTracker,
} from "@metrics-engine/index";
import type {
  ResponseLatencyTracker,
  InterruptionTracker,
  AudioPipeline,
  MonologueTracker,
} from "@metrics-engine/index";
import type { SessionMetrics } from "@metrics-engine/metrics-schema";
import {
  createCoachingEngine,
  DEFAULT_CONFIG,
  applySensitivity,
  loadSensitivityPercent,
  saveSensitivityPercent,
  percentToLevel,
  applyPreset,
  loadPreset,
  savePreset,
} from "@coaching-system/index";
import {
  createKudosEngine,
  type NudgeEvent,
  type KudosEvent,
  type SessionPreset,
  DEFAULT_SESSION_PRESET,
  DEFAULT_SENSITIVITY_PERCENT,
} from "@coaching-system/index";
import { saveSession, loadHistory } from "@/lib/session/session-store";
import { generateReport, computeTrends } from "@analytics-dashboard/index";
import type { ParticipantRole } from "@/lib/livekit/room";
import {
  API_PATHS,
  DEFAULTS,
  STORAGE_KEYS,
  INTERVALS,
  VIDEO_ELEMENT_STYLES,
} from "@/lib/constants";
import { sessionRoleToParticipantRole } from "@/lib/roles";
import type { EmotionScores } from "@video-processor/emotion-detection";

export type SessionRole = "teacher" | "student";

/** Debug stats exposed when debug mode is on */
export interface DebugStats {
  /** Who is currently speaking: teacher, student, both, or neither */
  speakerState: "teacher" | "student" | "both" | "neither";
  /** Cumulative talk time in ms per role */
  talkTimeMs: { tutor: number; student: number };
  /** Raw emotion scores contributing to student emotional state */
  emotionScores: EmotionScores;
  /** Current emotional state label */
  emotionalState: string;
  /** Interruption counts */
  interruptions: { studentToTutor: number; tutorToStudent: number };
  /** Response latency stats */
  responseLatency: { turnCount: number; avgMs: number; hesitationCount: number; turnsPerMinute?: number };
  /** Tutor monologue length in seconds */
  tutorMonologueSec?: number;
  /** Eye contact scores (tutor, student) */
  eyeContact: { tutor: number; student: number };
  /** Video quality per role */
  videoQuality: VideoQualityState | null;
  /** Pipeline latency (mediapipe p50 ms) */
  pipelineLatencyMs: number;
}

export type SessionStatus = "idle" | "connecting" | "connected" | "error";

export function useSessionRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomName = searchParams.get("room") ?? DEFAULTS.ROOM_NAME;
  const identity = searchParams.get("identity") ?? `user-${Date.now()}`;
  const role = (searchParams.get("role") === "student"
    ? "student"
    : "teacher") as SessionRole;

  const localRole: ParticipantRole = sessionRoleToParticipantRole(role);
  const remoteRole: ParticipantRole =
    role === "teacher" ? "student" : "tutor";

  const [status, setStatus] = useState<SessionStatus>("idle");
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [videoQuality, setVideoQuality] = useState<VideoQualityState | null>(
    null
  );
  const [nudges, setNudges] = useState<NudgeEvent[]>([]);
  const [kudos, setKudos] = useState<KudosEvent[]>([]);
  const [sensitivityPercent, setSensitivityPercent] = useState<number>(
    DEFAULT_SENSITIVITY_PERCENT
  );
  const [sessionPreset, setSessionPreset] =
    useState<SessionPreset>(DEFAULT_SESSION_PRESET);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const videoPipelineRef = useRef<VideoPipeline | null>(null);
  const audioPipelineRef = useRef<AudioPipeline | null>(null);
  const sessionMetricsHistory = useRef<SessionMetrics[]>([]);
  const interruptionTrackerRef = useRef<InterruptionTracker | null>(null);
  const responseLatencyTrackerRef = useRef<ResponseLatencyTracker | null>(null);
  const monologueTrackerRef = useRef<MonologueTracker | null>(null);
  const allNudgesRef = useRef<NudgeEvent[]>([]);
  const kudosEngineRef = useRef<ReturnType<typeof createKudosEngine> | null>(null);
  const sessionPresetRef = useRef<SessionPreset>(sessionPreset);
  const sessionStartMsRef = useRef<number | null>(null);

  sessionPresetRef.current = sessionPreset;

  const [debugMode, setDebugMode] = useState(false);
  const [debugStats, setDebugStats] = useState<DebugStats | null>(null);

  useEffect(() => {
    setSensitivityPercent(loadSensitivityPercent());
    setSessionPreset(loadPreset());
  }, []);

  const handleSensitivityChange = useCallback((percent: number) => {
    setSensitivityPercent(percent);
    saveSensitivityPercent(percent);
  }, []);

  const handlePresetChange = useCallback((preset: SessionPreset) => {
    setSessionPreset(preset);
    savePreset(preset);
  }, []);

  // Poll debug stats when debug mode is on and connected
  useEffect(() => {
    if (!debugMode || status !== "connected") {
      setDebugStats(null);
      return;
    }
    const interval = setInterval(() => {
      const vp = videoPipelineRef.current;
      const ap = audioPipelineRef.current;
      const it = interruptionTrackerRef.current;
      const rt = responseLatencyTrackerRef.current;
      const m = metrics;

      if (!m) return;

      const { tutor, student } = m.metrics;
      const speakerState: DebugStats["speakerState"] =
        tutor.current_speaking && student.current_speaking
          ? "both"
          : tutor.current_speaking
            ? "teacher"
            : student.current_speaking
              ? "student"
              : "neither";

      const talkTimeMs = ap
        ? (() => {
            const s = ap.getState();
            return { tutor: s.tutor.talkTimeMs, student: s.student.talkTimeMs };
          })()
        : { tutor: 0, student: 0 };

      const emotionScores = vp?.getStudentEmotionScores?.() ?? {
        positive: 0,
        neutral: 0,
        negative: 0,
      };
      const emotionalState = student.emotional_state ?? "neutral";

      const interruptions = it
        ? it.getStats()
        : { studentToTutor: 0, tutorToStudent: 0 };
      const latencyStats = rt?.getStats(
        undefined,
        INTERVALS.ROLLING_TALK_WINDOW_MS
      );
      const responseLatency = {
        turnCount: latencyStats?.turnCount ?? 0,
        avgMs: latencyStats?.avgResponseLatencyMs ?? 0,
        hesitationCount: latencyStats?.hesitationCount ?? 0,
        turnsPerMinute: latencyStats?.turnsPerMinute,
      };
      const tutorMonologueSec = (() => {
        const mt = monologueTrackerRef.current;
        if (!mt) return undefined;
        const stats = mt.getStats();
        const ms = stats.currentMonologueMs || stats.lastMonologueMs;
        return ms > 0 ? ms / 1000 : undefined;
      })();

      const videoQualityState = vp?.getQualityStatus?.() ?? null;
      const scores = vp?.getLatestScores?.();
      const eyeContact = scores
        ? { tutor: scores.tutor.eyeContactScore, student: scores.student.eyeContactScore }
        : { tutor: tutor.eye_contact_score, student: student.eye_contact_score };

      const mediapipeStats = vp?.latency?.getStageStats?.("mediapipe");
      const pipelineLatencyMs = mediapipeStats?.p50 ?? 0;

      setDebugStats({
        speakerState,
        talkTimeMs,
        emotionScores,
        emotionalState,
        interruptions: {
          studentToTutor: interruptions.studentToTutor,
          tutorToStudent: interruptions.tutorToStudent,
        },
        responseLatency,
        tutorMonologueSec,
        eyeContact,
        videoQuality: videoQualityState ?? videoQuality,
        pipelineLatencyMs,
      });
    }, INTERVALS.DEBUG_POLL_MS);
    return () => clearInterval(interval);
  }, [debugMode, status, metrics, videoQuality]);

  const startSession = useCallback(async () => {
    setStatus("connecting");
    setHasRemoteParticipant(false);

    try {
      const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (!liveKitUrl) throw new Error("NEXT_PUBLIC_LIVEKIT_URL not set");

      const res = await fetch(
        `${API_PATHS.TOKEN}?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(identity)}&role=${role}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to get token");
      }
      const { token } = await res.json();

      const config = applyPreset(
        applySensitivity(DEFAULT_CONFIG, percentToLevel(sensitivityPercent)),
        sessionPreset
      );

      allNudgesRef.current = [];
      sessionStartMsRef.current = Date.now();

      const videoPipeline = createVideoPipeline();
      videoPipelineRef.current = videoPipeline;
      const coachingEngine = createCoachingEngine(
        (nudge) => {
          setNudges((prev) => [...prev.slice(-4), nudge]);
          allNudgesRef.current.push(nudge);
        },
        config,
        {
          onKudos: (k) => setKudos((prev) => [...prev.slice(-4), k]),
          preset: () => sessionPresetRef.current,
        }
      );
      const interruptionTracker = createInterruptionTracker({
        onTutorInterruption: () => coachingEngine.recordTutorInterruption(),
      });
      interruptionTrackerRef.current = interruptionTracker;

      const latencyTracker = createResponseLatencyTracker();
      responseLatencyTrackerRef.current = latencyTracker;

      const monologueTracker = createMonologueTracker();
      monologueTrackerRef.current = monologueTracker;

      const kudosEngine = createKudosEngine(
        (k) => {
          setKudos((prev) => [...prev.slice(-4), k]);
        },
        {
          preset: () => sessionPresetRef.current,
          classifyKudosUrl: API_PATHS.CLASSIFY_KUDOS,
        }
      );
      kudosEngineRef.current = kudosEngine;

      const transcriptionOptions =
        role === "teacher"
          ? {
              onTranscriptReady: async (_r: ParticipantRole, blob: Blob) => {
                try {
                  const formData = new FormData();
                  formData.append("file", blob, "segment.webm");
                  const res = await fetch(API_PATHS.TRANSCRIBE, {
                    method: "POST",
                    body: formData,
                  });
                  if (res.ok) {
                    const { text } = (await res.json()) as { text?: string };
                    if (text) await kudosEngineRef.current?.onTranscript(text);
                  }
                } catch (err) {
                  console.warn("[useSessionRoom] Transcription failed:", err);
                }
              },
            }
          : undefined;

      const audioPipeline = createAudioPipeline(
        interruptionTracker,
        latencyTracker,
        monologueTracker,
        INTERVALS.ROLLING_TALK_WINDOW_MS,
        transcriptionOptions
      );
      audioPipelineRef.current = audioPipeline;
      const aggregator = createMetricsAggregator(
        roomName,
        (m) => {
          setMetrics(m);
          sessionMetricsHistory.current.push(m);
          setVideoQuality(videoPipelineRef.current?.getQualityStatus() ?? null);
          coachingEngine.evaluate(m);
        },
        sessionStartMsRef.current ?? undefined
      );

      const room = await connectToRoom(liveKitUrl, token, {
        onLocalVideoTrack: (el) => {
          el.style.cssText = VIDEO_ELEMENT_STYLES;
          const container = localVideoRef.current;
          if (container) {
            container.replaceChildren(el);
          }

          const sampler = createFrameSampler(el, (imageData, ts) => {
            const score = videoPipeline.processFrame(localRole, imageData, ts);
            if (score !== null) aggregator.updateEyeContact(localRole, score);
            if (localRole === "student") {
              aggregator.updateEmotionalState("student", videoPipeline.getStudentEmotionalState());
            }
          });
          sampler.start();
        },
        onRemoteVideoTrack: (el) => {
          setHasRemoteParticipant(true);
          el.style.cssText = VIDEO_ELEMENT_STYLES;
          const container = remoteVideoRef.current;
          if (container) {
            container.replaceChildren(el);
            el.play().catch(() => {});
          }

          const sampler = createFrameSampler(el, (imageData, ts) => {
            const score = videoPipeline.processFrame(remoteRole, imageData, ts);
            if (score !== null) aggregator.updateEyeContact(remoteRole, score);
            if (remoteRole === "student") {
              aggregator.updateEmotionalState("student", videoPipeline.getStudentEmotionalState());
            }
          });
          sampler.start();
        },
        onLocalAudioTrack: (stream) => {
          audioPipeline.addTrack(localRole, stream, (talkTime) => {
            aggregator.updateTalkTime(
              localRole,
              talkTime.talkTimePercent,
              talkTime.speaking,
              {
                percentRolling: talkTime.talkTimePercentRolling,
                rollingState: talkTime.rollingState,
                tutorMonologueSec: talkTime.tutorMonologueSec,
                tutorTurnsPerMinute: talkTime.tutorTurnsPerMinute,
              }
            );
          });
        },
        onRemoteAudioTrack: (stream) => {
          audioPipeline.addTrack(remoteRole, stream, (talkTime) => {
            aggregator.updateTalkTime(
              remoteRole,
              talkTime.talkTimePercent,
              talkTime.speaking,
              {
                percentRolling: talkTime.talkTimePercentRolling,
                rollingState: talkTime.rollingState,
                tutorMonologueSec: talkTime.tutorMonologueSec,
                tutorTurnsPerMinute: talkTime.tutorTurnsPerMinute,
              }
            );
          });
        },
        onRemoteDisconnect: () => {
          setHasRemoteParticipant(false);
          console.log("Remote participant disconnected");
        },
        onConnectionStateChange: (state) => {
          if (state === "connected") setStatus("connected");
        },
      });

      aggregator.start();
      roomRef.current = room;
      setStatus("connected");
    } catch (err) {
      console.error("Session error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, [
    roomName,
    identity,
    role,
    localRole,
    remoteRole,
    sensitivityPercent,
    sessionPreset,
  ]);

  const endSession = useCallback(async () => {
    videoPipelineRef.current = null;
    audioPipelineRef.current = null;
    kudosEngineRef.current?.destroy();
    kudosEngineRef.current = null;
    setVideoQuality(null);
    setDebugStats(null);
    if (roomRef.current) {
      await disconnectRoom(roomRef.current);
      roomRef.current = null;
    }

    let interruptionData = null;
    if (interruptionTrackerRef.current) {
      const stats = interruptionTrackerRef.current.getStats();
      interruptionData = {
        ...stats,
        classification: classifyInterruptionsWithContent(stats),
      };
    }

    const latencyStats = responseLatencyTrackerRef.current?.getStats();
    const sessionId = roomName + "-" + Date.now();
    const history = loadHistory();

    const report = generateReport(
      roomName,
      sessionMetricsHistory.current,
      interruptionData,
      {
        nudgeEvents: allNudgesRef.current,
        sessionStartMs: sessionStartMsRef.current ?? Date.now(),
        preset: sessionPreset,
      }
    );

    if (latencyStats && latencyStats.turnCount > 0) {
      report.summary.avgResponseLatencyMs = latencyStats.avgResponseLatencyMs;
      report.summary.hesitationCount = latencyStats.hesitationCount;
    }

    const storedSummary = {
      sessionId,
      storedAt: new Date().toISOString(),
      durationSec: report.summary.durationSec,
      avgTutorEyeContact: report.summary.avgTutorEyeContact,
      avgStudentEyeContact: report.summary.avgStudentEyeContact,
      avgTutorTalkPercent: report.summary.avgTutorTalkPercent,
      avgStudentTalkPercent: report.summary.avgStudentTalkPercent,
      studentTalkRatio: report.summary.studentTalkRatio,
      engagementScore: report.summary.engagementScore,
    };

    const trends = computeTrends(storedSummary, history);
    if (trends) {
      report.summary.trends = trends;
    }

    saveSession(storedSummary);
    sessionStorage.setItem(STORAGE_KEYS.REPORT, JSON.stringify(report));
    router.push("/report");
  }, [roomName, router, sessionPreset]);

  const dismissNudge = useCallback((id: string) => {
    setNudges((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissKudos = useCallback((id: string) => {
    setKudos((prev) => prev.filter((k) => k.id !== id));
  }, []);

    return {
    roomName,
    role,
    localRole,
    remoteRole,
    status,
    hasRemoteParticipant,
    errorMsg,
    metrics,
    videoQuality,
    nudges,
    kudos,
    sensitivityPercent,
    sessionPreset,
    debugMode,
    setDebugMode,
    debugStats,
    handleSensitivityChange,
    handlePresetChange,
    startSession,
    endSession,
    dismissNudge,
    dismissKudos,
    localVideoRef,
    remoteVideoRef,
  };
}
