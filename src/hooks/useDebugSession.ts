"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  MetricsAggregator,
  MonologueTracker,
} from "@metrics-engine/index";
import type { SessionMetrics } from "@metrics-engine/metrics-schema";
import type { DebugStats } from "@/hooks/useSessionRoom";
import {
  createCoachingEngine,
  createKudosEngine,
  DEFAULT_CONFIG,
  applySensitivity,
  applyPreset,
  loadPreset,
  savePreset,
  percentToLevel,
  loadSensitivityPercent,
  saveSensitivityPercent,
} from "@coaching-system/index";
import type { NudgeEvent, KudosEvent, SessionPreset } from "@coaching-system/index";
import { generateReport, computeTrends } from "@analytics-dashboard/index";
import { saveSession, loadHistory } from "@/lib/session/session-store";
import { API_PATHS, NUDGE_GRACE_PERIOD_MS, STORAGE_KEYS, VIDEO_ELEMENT_STYLES, INTERVALS } from "@/lib/constants";

export type DebugSessionStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export interface UseDebugSessionOptions {
  sessionId?: string;
}

export function useDebugSession(options: UseDebugSessionOptions = {}) {
  const router = useRouter();
  const sessionId = options.sessionId ?? `debug-${Date.now()}`;

  const [status, setStatus] = useState<DebugSessionStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [videoQuality, setVideoQuality] = useState<VideoQualityState | null>(null);
  const [nudges, setNudges] = useState<NudgeEvent[]>([]);
  const [kudos, setKudos] = useState<KudosEvent[]>([]);
  const [sensitivityPercent, setSensitivityPercent] = useState(loadSensitivityPercent);
  const [sessionPreset, setSessionPreset] = useState<SessionPreset>(loadPreset);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tutorMuted, setTutorMuted] = useState(false);
  const [studentMuted, setStudentMuted] = useState(false);

  const aggregatorRef = useRef<MetricsAggregator | null>(null);

  const tutorVideoRef = useRef<HTMLVideoElement | null>(null);
  const studentVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoPipelineRef = useRef<VideoPipeline | null>(null);
  const audioPipelineRef = useRef<AudioPipeline | null>(null);
  const sessionMetricsHistory = useRef<SessionMetrics[]>([]);
  const interruptionTrackerRef = useRef<InterruptionTracker | null>(null);
  const responseLatencyTrackerRef = useRef<ResponseLatencyTracker | null>(null);
  const allNudgesRef = useRef<NudgeEvent[]>([]);
  const sessionStartMsRef = useRef<number | null>(null);
  const frameSamplersRef = useRef<Array<{ start: () => void; stop: () => void }>>([]);
  const monologueTrackerRef = useRef<MonologueTracker | null>(null);
  const kudosEngineRef = useRef<ReturnType<typeof createKudosEngine> | null>(null);
  const sessionPresetRef = useRef<SessionPreset>(sessionPreset);
  const [debugStats, setDebugStats] = useState<DebugStats | null>(null);
  const [transcriptLog, setTranscriptLog] = useState<
    Array<{ role: "tutor" | "student"; text: string; timestamp: number }>
  >([]);

  sessionPresetRef.current = sessionPreset;

  const handleSensitivityChange = useCallback((percent: number) => {
    setSensitivityPercent(percent);
    saveSensitivityPercent(percent);
  }, []);

  const handlePresetChange = useCallback((preset: SessionPreset) => {
    setSessionPreset(preset);
    savePreset(preset);
  }, []);

  // Poll debug stats when session is playing or paused
  useEffect(() => {
    if (status !== "playing" && status !== "paused") {
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
        positive: 0, neutral: 0, negative: 0,
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
        transcriptLog,
      });
    }, INTERVALS.DEBUG_POLL_MS);
    return () => clearInterval(interval);
  }, [status, metrics, videoQuality, transcriptLog]);

  const startSession = useCallback(
    async (
      tutorFile: File,
      studentFile: File,
      tutorContainer: RefObject<HTMLDivElement | null>,
      studentContainer: RefObject<HTMLDivElement | null>
    ) => {
      setStatus("loading");
      setErrorMsg("");
      setTutorMuted(false);
      setStudentMuted(false);
      allNudgesRef.current = [];
      sessionMetricsHistory.current = [];
      sessionStartMsRef.current = Date.now();

      try {
        const tutorUrl = URL.createObjectURL(tutorFile);
        const studentUrl = URL.createObjectURL(studentFile);

        const tutorVideo = document.createElement("video");
        const studentVideo = document.createElement("video");
        tutorVideo.playsInline = true;
        studentVideo.playsInline = true;
        tutorVideo.muted = false;
        studentVideo.muted = false;
        tutorVideo.style.cssText = VIDEO_ELEMENT_STYLES;
        studentVideo.style.cssText = VIDEO_ELEMENT_STYLES;

        tutorVideo.src = tutorUrl;
        studentVideo.src = studentUrl;

        tutorVideoRef.current = tutorVideo;
        studentVideoRef.current = studentVideo;

        tutorContainer.current?.replaceChildren(tutorVideo);
        studentContainer.current?.replaceChildren(studentVideo);

        await Promise.all([
          new Promise<void>((resolve, reject) => {
            tutorVideo.oncanplay = () => resolve();
            tutorVideo.onerror = () => reject(new Error("Failed to load tutor video"));
          }),
          new Promise<void>((resolve, reject) => {
            studentVideo.oncanplay = () => resolve();
            studentVideo.onerror = () => reject(new Error("Failed to load student video"));
          }),
        ]);

        const config = applyPreset(
          applySensitivity(DEFAULT_CONFIG, percentToLevel(sensitivityPercent)),
          sessionPreset
        );

        const videoPipeline = createVideoPipeline();
        videoPipelineRef.current = videoPipeline;

        const coachingEngine = createCoachingEngine(
          (nudge) => {
            const start = sessionStartMsRef.current;
            if (start === null || Date.now() - start < NUDGE_GRACE_PERIOD_MS) return;
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
          (k) => setKudos((prev) => [...prev.slice(-4), k]),
          {
            preset: () => sessionPresetRef.current,
            classifyKudosUrl: API_PATHS.CLASSIFY_KUDOS,
          }
        );
        kudosEngineRef.current = kudosEngine;

        const transcriptionOptions = {
          onTranscriptReady: async (
            role: "tutor" | "student",
            blob: Blob
          ) => {
            console.debug("[transcription] Received blob:", blob.size, "bytes, role:", role);
            if (blob.size < 1000) {
              console.debug("[transcription] Skipping: blob too small (<1KB), Whisper would return empty");
              return;
            }
            try {
              const formData = new FormData();
              formData.append("file", blob, "segment.webm");
              const res = await fetch(API_PATHS.TRANSCRIBE, {
                method: "POST",
                body: formData,
              });
              const body = (await res.json().catch(() => ({}))) as {
                text?: string;
                error?: string;
                detail?: string;
              };
              if (!res.ok) {
                console.warn(
                  "[transcription] API error:",
                  res.status,
                  body.error ?? body.detail ?? JSON.stringify(body)
                );
                return;
              }
              const text = (body.text ?? "").trim();
              if (!text) {
                console.debug("[transcription] API returned empty text (silence or inaudible)");
                return;
              }
              setTranscriptLog((prev) => {
                const next = [...prev.slice(-19), { role, text, timestamp: Date.now() }];
                return next;
              });
              console.debug("[transcription]", role, text.slice(0, 60) + (text.length > 60 ? "…" : ""));
              await kudosEngineRef.current?.onTranscript(text);
            } catch (err) {
              console.warn("[transcription] Failed:", err);
            }
          },
        };

        const audioPipeline = createAudioPipeline(
          interruptionTracker,
          latencyTracker,
          monologueTracker,
          INTERVALS.ROLLING_TALK_WINDOW_MS,
          transcriptionOptions
        );
        audioPipelineRef.current = audioPipeline;

        const aggregator = createMetricsAggregator(
          sessionId,
          (m) => {
          setMetrics(m);
          sessionMetricsHistory.current.push(m);
          setVideoQuality(videoPipelineRef.current?.getQualityStatus() ?? null);
          coachingEngine.evaluate(m);
        },
          sessionStartMsRef.current ?? undefined
        );
        aggregatorRef.current = aggregator;

        // captureStream() exists on HTMLMediaElement but may be missing from TS DOM lib
        const captureStream = (el: HTMLVideoElement): MediaStream =>
          (el as unknown as { captureStream(): MediaStream }).captureStream();
        const tutorStream = captureStream(tutorVideo);
        const studentStream = captureStream(studentVideo);

        audioPipeline.addTrack("tutor", tutorStream, (talkTime) => {
          aggregator.updateTalkTime(
            "tutor",
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
        audioPipeline.addTrack("student", studentStream, (talkTime) => {
          aggregator.updateTalkTime(
            "student",
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

        aggregator.start();

        const tutorSampler = createFrameSampler(tutorVideo, (imageData, ts) => {
          const score = videoPipeline.processFrame("tutor", imageData, ts);
          if (score !== null) aggregator.updateEyeContact("tutor", score);
        });
        tutorSampler.start();
        frameSamplersRef.current.push(tutorSampler);

        const studentSampler = createFrameSampler(studentVideo, (imageData, ts) => {
          const score = videoPipeline.processFrame("student", imageData, ts);
          if (score !== null) aggregator.updateEyeContact("student", score);
          aggregator.updateEmotionalState(
            "student",
            videoPipeline.getStudentEmotionalState()
          );
        });
        studentSampler.start();
        frameSamplersRef.current.push(studentSampler);

        const handleEnded = () => {
          if (tutorVideo.ended && studentVideo.ended) {
            endSession();
          }
        };
        tutorVideo.addEventListener("ended", handleEnded);
        studentVideo.addEventListener("ended", handleEnded);

        const syncDuration = () => {
          const d = Math.min(tutorVideo.duration, studentVideo.duration);
          if (Number.isFinite(d)) setDuration(d);
        };
        const syncTime = () => {
          const t = Math.min(tutorVideo.currentTime, studentVideo.currentTime);
          if (Number.isFinite(t)) setCurrentTime(t);
        };
        tutorVideo.addEventListener("loadedmetadata", syncDuration);
        studentVideo.addEventListener("loadedmetadata", syncDuration);
        tutorVideo.addEventListener("timeupdate", syncTime);
        studentVideo.addEventListener("timeupdate", syncTime);
        syncDuration();
        syncTime();

        await Promise.all([tutorVideo.play(), studentVideo.play()]);

        setStatus("playing");
      } catch (err) {
        console.error("Debug session error:", err);
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    },
    [sessionId, sensitivityPercent, sessionPreset]
  );

  const endSession = useCallback(() => {
    for (const sampler of frameSamplersRef.current) {
      sampler.stop();
    }
    frameSamplersRef.current = [];

    aggregatorRef.current?.stop?.();
    aggregatorRef.current = null;
    videoPipelineRef.current = null;
    audioPipelineRef.current?.destroy?.();
    audioPipelineRef.current = null;
    kudosEngineRef.current?.destroy();
    kudosEngineRef.current = null;
    monologueTrackerRef.current = null;
    setVideoQuality(null);
    setDebugStats(null);
    setTranscriptLog([]);

    let interruptionData = null;
    if (interruptionTrackerRef.current) {
      const stats = interruptionTrackerRef.current.getStats();
      interruptionData = {
        ...stats,
        classification: classifyInterruptionsWithContent(stats),
      };
    }

    const latencyStats = responseLatencyTrackerRef.current?.getStats();
    const report = generateReport(
      sessionId,
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

    const history = loadHistory();
    const trends = computeTrends(storedSummary, history);
    if (trends) {
      report.summary.trends = trends;
    }

    saveSession(storedSummary);
    (report as { isDebug?: boolean }).isDebug = true;
    (report as { metricsHistory?: SessionMetrics[] }).metricsHistory =
      sessionMetricsHistory.current;
    sessionStorage.setItem(STORAGE_KEYS.REPORT, JSON.stringify(report));
    setStatus("ended");
    router.push("/report");
  }, [sessionId, sessionPreset, router]);

  const dismissNudge = useCallback((id: string) => {
    setNudges((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissKudos = useCallback((id: string) => {
    setKudos((prev) => prev.filter((k) => k.id !== id));
  }, []);

  const togglePause = useCallback(() => {
    const tutor = tutorVideoRef.current;
    const student = studentVideoRef.current;
    const samplers = frameSamplersRef.current;
    if (!tutor || !student) return;
    if (tutor.paused) {
      tutor.play();
      student.play();
      for (const s of samplers) s.start();
      setStatus("playing");
    } else {
      tutor.pause();
      student.pause();
      for (const s of samplers) s.stop();
      setStatus("paused");
    }
  }, []);

  const toggleTutorMute = useCallback(() => {
    const tutor = tutorVideoRef.current;
    if (!tutor) return;
    const next = !tutor.muted;
    tutor.muted = next;
    setTutorMuted(next);
  }, []);

  const toggleStudentMute = useCallback(() => {
    const student = studentVideoRef.current;
    if (!student) return;
    const next = !student.muted;
    student.muted = next;
    setStudentMuted(next);
  }, []);

  return {
    status,
    errorMsg,
    metrics,
    videoQuality,
    nudges,
    kudos,
    sensitivityPercent,
    sessionPreset,
    currentTime,
    duration,
    debugStats,
    handleSensitivityChange,
    handlePresetChange,
    startSession,
    endSession,
    togglePause,
    dismissNudge,
    dismissKudos,
    tutorVideoRef,
    studentVideoRef,
    tutorMuted,
    studentMuted,
    toggleTutorMute,
    toggleStudentMute,
  };
}
