"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Room } from "livekit-client";
import { connectToRoom, disconnectRoom } from "@/lib/livekit/room";
import { createFrameSampler } from "@/lib/video/frame-sampler";
import { createVideoPipeline } from "@/lib/video/pipeline";
import { createAudioPipeline, AudioPipelineOutput } from "@/lib/audio/pipeline";
import { createMetricsAggregator } from "@/lib/metrics/aggregator";
import { createCoachingEngine } from "@/lib/coaching/engine";
import { createInterruptionTracker } from "@/lib/audio/interruptions";
import { classifyInterruptionsWithContent } from "@/lib/audio/interruption-classification";
import { createResponseLatencyTracker, ResponseLatencyTracker } from "@/lib/audio/response-latency";
import { generateReport } from "@/lib/post-session/report";
import { DEFAULT_CONFIG } from "@/lib/coaching/config";
import {
  applySensitivity,
  loadSensitivity,
  saveSensitivity,
  type SensitivityLevel,
} from "@/lib/coaching/sensitivity";
import {
  applyPreset,
  loadPreset,
  savePreset,
  type SessionPreset,
} from "@/lib/coaching/presets";
import { saveSession } from "@/lib/session/session-store";
import { loadHistory } from "@/lib/session/session-store";
import { computeTrends } from "@/lib/post-session/trends";
import type { SessionMetrics } from "@/lib/session/metrics-schema";
import type { NudgeEvent } from "@/lib/coaching/engine";
import type { InterruptionTracker } from "@/lib/audio/interruptions";
import type { ParticipantRole } from "@/lib/livekit/room";
import MetricsDisplay from "@/components/MetricsDisplay";
import NudgeToast from "@/components/NudgeToast";
import ConsentBanner from "@/components/ConsentBanner";
import SensitivitySelector from "@/components/SensitivitySelector";
import SessionTypeSelector from "@/components/SessionTypeSelector";

type SessionRole = "teacher" | "student";

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomName = searchParams.get("room") ?? "sessionlens-demo";
  const identity = searchParams.get("identity") ?? `user-${Date.now()}`;
  const role = (searchParams.get("role") === "student" ? "student" : "teacher") as SessionRole;

  const localRole: ParticipantRole = role === "teacher" ? "tutor" : "student";
  const remoteRole: ParticipantRole = role === "teacher" ? "student" : "tutor";

  const [consented, setConsented] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [nudges, setNudges] = useState<NudgeEvent[]>([]);

  // M27: sensitivity level
  const [sensitivityLevel, setSensitivityLevel] = useState<SensitivityLevel>("medium");
  // M28: session preset
  const [sessionPreset, setSessionPreset] = useState<SessionPreset>("general");

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const sessionMetricsHistory = useRef<SessionMetrics[]>([]);
  const interruptionTrackerRef = useRef<InterruptionTracker | null>(null);
  // M21: response latency tracker
  const responseLatencyTrackerRef = useRef<ResponseLatencyTracker | null>(null);
  // Track all nudges (not just last-5 displayed) for flagged moments
  const allNudgesRef = useRef<NudgeEvent[]>([]);
  // Track session start time for flagged moment offsets
  const sessionStartMsRef = useRef<number | null>(null);

  // Load persisted settings from localStorage on mount
  useEffect(() => {
    setSensitivityLevel(loadSensitivity());
    setSessionPreset(loadPreset());
  }, []);

  function handleSensitivityChange(level: SensitivityLevel) {
    setSensitivityLevel(level);
    saveSensitivity(level);
  }

  function handlePresetChange(preset: SessionPreset) {
    setSessionPreset(preset);
    savePreset(preset);
  }

  const startSession = useCallback(async () => {
    setStatus("connecting");

    try {
      const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (!liveKitUrl) throw new Error("NEXT_PUBLIC_LIVEKIT_URL not set");

      // Fetch token
      const res = await fetch(
        `/api/token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(identity)}&role=${role}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to get token");
      }
      const { token } = await res.json();

      // M27 + M28: Apply sensitivity and preset to config
      const config = applyPreset(applySensitivity(DEFAULT_CONFIG, sensitivityLevel), sessionPreset);

      // Reset nudge history for new session
      allNudgesRef.current = [];
      sessionStartMsRef.current = Date.now();

      // Create pipelines
      const videoPipeline = createVideoPipeline();
      const coachingEngine = createCoachingEngine((nudge) => {
        setNudges((prev) => [...prev.slice(-4), nudge]);
        allNudgesRef.current.push(nudge);
      }, config);
      const interruptionTracker = createInterruptionTracker({
        onTutorInterruption: () =>
          coachingEngine.recordTutorInterruption(),
      });
      interruptionTrackerRef.current = interruptionTracker;

      // M21: Create response latency tracker
      const latencyTracker = createResponseLatencyTracker();
      responseLatencyTrackerRef.current = latencyTracker;

      const audioPipeline = createAudioPipeline(interruptionTracker, latencyTracker);
      const aggregator = createMetricsAggregator(
        roomName,
        (m) => {
          setMetrics(m);
          sessionMetricsHistory.current.push(m);
          coachingEngine.evaluate(m);
        }
      );

      // Connect to room
      const room = await connectToRoom(liveKitUrl, token, {
        onLocalVideoTrack: (el) => {
          el.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:0.5rem;";
          localVideoRef.current?.appendChild(el);

          const sampler = createFrameSampler(el, (imageData, ts) => {
            const score = videoPipeline.processFrame(localRole, imageData, ts);
            if (score !== null) aggregator.updateEyeContact(localRole, score);
          });
          sampler.start();
        },
        onRemoteVideoTrack: (el) => {
          el.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:0.5rem;";
          remoteVideoRef.current?.appendChild(el);

          const sampler = createFrameSampler(el, (imageData, ts) => {
            const score = videoPipeline.processFrame(remoteRole, imageData, ts);
            if (score !== null) aggregator.updateEyeContact(remoteRole, score);
          });
          sampler.start();
        },
        onLocalAudioTrack: (stream) => {
          audioPipeline.addTrack(localRole, stream, (talkTime) => {
            aggregator.updateTalkTime(localRole, talkTime.talkTimePercent, talkTime.speaking);
          });
        },
        onRemoteAudioTrack: (stream) => {
          audioPipeline.addTrack(remoteRole, stream, (talkTime) => {
            aggregator.updateTalkTime(remoteRole, talkTime.talkTimePercent, talkTime.speaking);
          });
        },
        onRemoteDisconnect: () => {
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
  }, [roomName, identity, localRole, remoteRole, sensitivityLevel, sessionPreset]);

  async function endSession() {
    if (roomRef.current) {
      await disconnectRoom(roomRef.current);
      roomRef.current = null;
    }

    // Collect interruption data if tracker was active
    let interruptionData = null;
    if (interruptionTrackerRef.current) {
      const stats = interruptionTrackerRef.current.getStats();
      interruptionData = { ...stats, classification: classifyInterruptionsWithContent(stats) };
    }

    // M21: Collect latency stats
    const latencyStats = responseLatencyTrackerRef.current?.getStats();

    // M24: Load history and compute trends
    const sessionId = roomName + "-" + Date.now();
    const history = loadHistory();

    // Generate report with M25 flagged moments and M24 trends placeholder
    const report = generateReport(
      roomName,
      sessionMetricsHistory.current,
      interruptionData,
      {
        nudgeEvents: allNudgesRef.current,
        sessionStartMs: sessionStartMsRef.current ?? Date.now(),
      }
    );

    // Attach M21 latency stats to summary
    if (latencyStats && latencyStats.turnCount > 0) {
      report.summary.avgResponseLatencyMs = latencyStats.avgResponseLatencyMs;
      report.summary.hesitationCount = latencyStats.hesitationCount;
    }

    // M24: Build stored summary and compute trends
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
  }

  // Auto-start when consented
  useEffect(() => {
    if (consented) {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented]);

  function dismissNudge(id: string) {
    setNudges((prev) => prev.filter((n) => n.id !== id));
  }

  if (!consented) {
    return <ConsentBanner onConsent={() => setConsented(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white">SessionLens</span>
          <span className="text-gray-400 text-sm">Room: {roomName}</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              role === "teacher"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
            }`}
          >
            You're the {role === "teacher" ? "Teacher" : "Student"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* M28: Session type selector */}
          <SessionTypeSelector value={sessionPreset} onChange={handlePresetChange} />
          {/* M27: Nudge sensitivity selector */}
          <SensitivitySelector value={sensitivityLevel} onChange={handleSensitivityChange} />
          <span className={`text-xs px-2 py-1 rounded-full ${
            status === "connected" ? "bg-green-900 text-green-300" :
            status === "connecting" ? "bg-yellow-900 text-yellow-300" :
            status === "error" ? "bg-red-900 text-red-300" :
            "bg-gray-800 text-gray-400"
          }`}>
            {status}
          </span>
          <button
            onClick={endSession}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Video feeds */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div
            className={`rounded-xl overflow-hidden ${
              role === "teacher"
                ? "ring-2 ring-amber-500/50 ring-offset-2 ring-offset-gray-950"
                : "ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-gray-950"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 px-1 ${
                role === "teacher" ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              You — {role === "teacher" ? "Teacher" : "Student"}
            </p>
            <div
              ref={localVideoRef}
              className="bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center"
            >
              {status !== "connected" && (
                <span className="text-gray-500 text-sm">
                  {status === "connecting" ? "Connecting..." : "Waiting..."}
                </span>
              )}
            </div>
          </div>
          <div
            className={`rounded-xl overflow-hidden ${
              role === "teacher"
                ? "ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-gray-950"
                : "ring-2 ring-amber-500/30 ring-offset-2 ring-offset-gray-950"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 px-1 ${
                role === "teacher" ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {remoteRole === "tutor" ? "Teacher" : "Student"}
            </p>
            <div
              ref={remoteVideoRef}
              className="bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center"
            >
              {status === "connected" && (
                <span className="text-gray-500 text-sm">
                  Waiting for {remoteRole === "tutor" ? "teacher" : "student"}…
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metrics panel */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <MetricsDisplay metrics={metrics} />
        </div>
      </div>

      {/* Error */}
      {status === "error" && (
        <div className="mx-4 mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
          {errorMsg || "Connection failed"}
        </div>
      )}

      {/* Nudge toasts */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {nudges.map((nudge) => (
          <NudgeToast key={nudge.id} nudge={nudge} onDismiss={dismissNudge} />
        ))}
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>}>
      <SessionContent />
    </Suspense>
  );
}
