"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Room } from "livekit-client";
import { connectToRoom, disconnectRoom } from "@/lib/livekit/room";
import { createFrameSampler } from "@/lib/video/frame-sampler";
import { createVideoPipeline, VideoPipelineOutput } from "@/lib/video/pipeline";
import { createAudioPipeline, AudioPipelineOutput } from "@/lib/audio/pipeline";
import { createMetricsAggregator } from "@/lib/metrics/aggregator";
import { createCoachingEngine } from "@/lib/coaching/engine";
import { generateReport } from "@/lib/post-session/report";
import type { SessionMetrics } from "@/lib/session/metrics-schema";
import type { NudgeEvent } from "@/lib/coaching/engine";
import MetricsDisplay from "@/components/MetricsDisplay";
import NudgeToast from "@/components/NudgeToast";
import ConsentBanner from "@/components/ConsentBanner";

function SessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomName = searchParams.get("room") ?? "sessionlens-demo";
  const identity = searchParams.get("identity") ?? `user-${Date.now()}`;

  const [consented, setConsented] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [nudges, setNudges] = useState<NudgeEvent[]>([]);

  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const sessionMetricsHistory = useRef<SessionMetrics[]>([]);

  const startSession = useCallback(async () => {
    setStatus("connecting");

    try {
      const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (!liveKitUrl) throw new Error("NEXT_PUBLIC_LIVEKIT_URL not set");

      // Fetch token
      const res = await fetch(
        `/api/token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(identity)}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to get token");
      }
      const { token } = await res.json();

      // Create pipelines
      const videoPipeline = createVideoPipeline();
      const audioPipeline = createAudioPipeline();
      const coachingEngine = createCoachingEngine((nudge) => {
        setNudges((prev) => [...prev.slice(-4), nudge]);
      });
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

          // Start frame sampler for tutor
          const sampler = createFrameSampler(el, (imageData, ts) => {
            const score = videoPipeline.processFrame("tutor", imageData, ts);
            if (score !== null) aggregator.updateEyeContact("tutor", score);
          });
          sampler.start();
        },
        onRemoteVideoTrack: (el) => {
          el.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:0.5rem;";
          remoteVideoRef.current?.appendChild(el);

          // Start frame sampler for student
          const sampler = createFrameSampler(el, (imageData, ts) => {
            const score = videoPipeline.processFrame("student", imageData, ts);
            if (score !== null) aggregator.updateEyeContact("student", score);
          });
          sampler.start();
        },
        onLocalAudioTrack: (stream) => {
          audioPipeline.addTrack("tutor", stream, (talkTime) => {
            aggregator.updateTalkTime("tutor", talkTime.talkTimePercent, talkTime.speaking);
          });
        },
        onRemoteAudioTrack: (stream) => {
          audioPipeline.addTrack("student", stream, (talkTime) => {
            aggregator.updateTalkTime("student", talkTime.talkTimePercent, talkTime.speaking);
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
  }, [roomName, identity]);

  async function endSession() {
    if (roomRef.current) {
      await disconnectRoom(roomRef.current);
      roomRef.current = null;
    }

    // Generate report and navigate
    const report = generateReport(roomName, sessionMetricsHistory.current);
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
        <div>
          <span className="font-semibold text-white">SessionLens</span>
          <span className="text-gray-400 text-sm ml-2">Room: {roomName}</span>
        </div>
        <div className="flex items-center gap-4">
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
          <div>
            <p className="text-xs text-gray-400 mb-1">You (tutor)</p>
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
          <div>
            <p className="text-xs text-gray-400 mb-1">Student</p>
            <div
              ref={remoteVideoRef}
              className="bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center"
            >
              {status === "connected" && (
                <span className="text-gray-500 text-sm">Waiting for student...</span>
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
