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
} from "@metrics-engine/index";
import type { ResponseLatencyTracker, InterruptionTracker } from "@metrics-engine/index";
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
import type { NudgeEvent, SessionPreset } from "@coaching-system/index";
import { saveSession, loadHistory } from "@/lib/session/session-store";
import { generateReport, computeTrends } from "@analytics-dashboard/index";
import type { ParticipantRole } from "@/lib/livekit/room";

export type SessionRole = "teacher" | "student";

export type SessionStatus = "idle" | "connecting" | "connected" | "error";

export function useSessionRoom() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomName = searchParams.get("room") ?? "sessionlens-demo";
  const identity = searchParams.get("identity") ?? `user-${Date.now()}`;
  const role = (searchParams.get("role") === "student"
    ? "student"
    : "teacher") as SessionRole;

  const localRole: ParticipantRole = role === "teacher" ? "tutor" : "student";
  const remoteRole: ParticipantRole = role === "teacher" ? "student" : "tutor";

  const [status, setStatus] = useState<SessionStatus>("idle");
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [videoQuality, setVideoQuality] = useState<VideoQualityState | null>(
    null
  );
  const [nudges, setNudges] = useState<NudgeEvent[]>([]);
  const [sensitivityPercent, setSensitivityPercent] = useState<number>(50);
  const [sessionPreset, setSessionPreset] = useState<SessionPreset>("socratic");

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const videoPipelineRef = useRef<VideoPipeline | null>(null);
  const sessionMetricsHistory = useRef<SessionMetrics[]>([]);
  const interruptionTrackerRef = useRef<InterruptionTracker | null>(null);
  const responseLatencyTrackerRef = useRef<ResponseLatencyTracker | null>(null);
  const allNudgesRef = useRef<NudgeEvent[]>([]);
  const sessionStartMsRef = useRef<number | null>(null);

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

  const startSession = useCallback(async () => {
    setStatus("connecting");
    setHasRemoteParticipant(false);

    try {
      const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (!liveKitUrl) throw new Error("NEXT_PUBLIC_LIVEKIT_URL not set");

      const res = await fetch(
        `/api/token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(identity)}&role=${role}`
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
        config
      );
      const interruptionTracker = createInterruptionTracker({
        onTutorInterruption: () => coachingEngine.recordTutorInterruption(),
      });
      interruptionTrackerRef.current = interruptionTracker;

      const latencyTracker = createResponseLatencyTracker();
      responseLatencyTrackerRef.current = latencyTracker;

      const audioPipeline = createAudioPipeline(
        interruptionTracker,
        latencyTracker
      );
      const aggregator = createMetricsAggregator(roomName, (m) => {
        setMetrics(m);
        sessionMetricsHistory.current.push(m);
        setVideoQuality(videoPipelineRef.current?.getQualityStatus() ?? null);
        coachingEngine.evaluate(m);
      });

      const room = await connectToRoom(liveKitUrl, token, {
        onLocalVideoTrack: (el) => {
          el.style.cssText =
            "width:100%;height:100%;object-fit:cover;border-radius:0.5rem;";
          localVideoRef.current?.appendChild(el);

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
          el.style.cssText =
            "width:100%;height:100%;object-fit:cover;border-radius:0.5rem;";
          remoteVideoRef.current?.appendChild(el);

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
              talkTime.speaking
            );
          });
        },
        onRemoteAudioTrack: (stream) => {
          audioPipeline.addTrack(remoteRole, stream, (talkTime) => {
            aggregator.updateTalkTime(
              remoteRole,
              talkTime.talkTimePercent,
              talkTime.speaking
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
    setVideoQuality(null);
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
    sessionStorage.setItem("sessionlens-report", JSON.stringify(report));
    router.push("/report");
  }, [roomName, router]);

  const dismissNudge = useCallback((id: string) => {
    setNudges((prev) => prev.filter((n) => n.id !== id));
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
    sensitivityPercent,
    sessionPreset,
    handleSensitivityChange,
    handlePresetChange,
    startSession,
    endSession,
    dismissNudge,
    localVideoRef,
    remoteVideoRef,
  };
}
