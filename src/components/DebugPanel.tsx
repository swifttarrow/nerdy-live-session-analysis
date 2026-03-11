"use client";

import type { DebugStats } from "@/hooks/useSessionRoom";
import EmotionIcon from "@/components/EmotionIcon";
import {
  TIME_UNITS,
  PIPELINE_LATENCY_WARNING_MS,
} from "@/lib/constants";

function DebugBadge({
  label,
  active,
  variant = "default",
}: {
  label: string;
  active: boolean;
  variant?: "teacher" | "student" | "both" | "default";
}) {
  const variantClass =
    variant === "teacher"
      ? "bg-amber-500/30 text-amber-400 border-amber-500/50"
      : variant === "student"
        ? "bg-emerald-500/30 text-emerald-400 border-emerald-500/50"
        : variant === "both"
          ? "bg-purple-500/30 text-purple-400 border-purple-500/50"
          : "bg-gray-600/30 text-gray-400 border-gray-500/50";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
        active ? variantClass : "bg-gray-800/50 text-gray-500 border-gray-700"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-current animate-pulse" : "bg-gray-600"}`}
      />
      {label}
    </span>
  );
}

/** Debug metrics content for embedding in Live Metrics when debug mode is on */
export function DebugMetricsContent({
  debugStats,
  embedded = false,
}: {
  debugStats: DebugStats;
  embedded?: boolean;
}) {
  const {
    speakerState,
    talkTimeMs,
    emotionScores,
    emotionalState,
    interruptions,
    responseLatency,
    tutorMonologueSec,
    eyeContact,
    videoQuality,
    pipelineLatencyMs,
  } = debugStats;

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / TIME_UNITS.MS_PER_SEC);
    const m = Math.floor(s / TIME_UNITS.SEC_PER_MIN);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  return (
    <div className={embedded ? "space-y-4 text-xs" : "bg-gray-900/95 rounded-lg p-4 space-y-4 text-xs border border-gray-700"}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-cyan-400 uppercase tracking-wider">
            Debug Mode
          </h3>
        </div>
      )}

      {/* Speaker detection */}
      <div>
        <div className="text-gray-400 mb-1.5 font-medium">Speaker detection</div>
        <div className="flex flex-wrap gap-2">
          <DebugBadge
            label="Teacher"
            active={speakerState === "teacher" || speakerState === "both"}
            variant="teacher"
          />
          <DebugBadge
            label="Student"
            active={speakerState === "student" || speakerState === "both"}
            variant="student"
          />
          <DebugBadge
            label="Both"
            active={speakerState === "both"}
            variant="both"
          />
          <DebugBadge
            label="Neither"
            active={speakerState === "neither"}
            variant="default"
          />
        </div>
      </div>

      {/* Talk time counters */}
      <div>
        <div className="text-gray-400 mb-1.5 font-medium">Talk time (running)</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <span className="text-amber-400">Teacher:</span>{" "}
            {formatMs(talkTimeMs.tutor)}
          </div>
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <span className="text-emerald-400">Student:</span>{" "}
            {formatMs(talkTimeMs.student)}
          </div>
        </div>
      </div>

      {/* Emotional state hints */}
      <div>
        <div className="flex items-center gap-2 text-gray-400 mb-1.5 font-medium">
          <EmotionIcon state={emotionalState} size="sm" />
          Emotional state: {emotionalState}
        </div>
        <div className="text-gray-500 text-[10px] mb-1">
          Raw scores (threshold 0.35, favors negative when close):
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["positive", "neutral", "negative"] as const)
            .map((k) => ({
              key: k,
              score: emotionScores[k as keyof typeof emotionScores] ?? 0,
            }))
            .map(({ key, score }) => (
              <div key={key} className="flex items-center gap-2">
                <EmotionIcon state={key} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500/80"
                      style={{ width: `${score * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-gray-400 w-6 text-[10px]">
                  {(score * 100).toFixed(0)}%
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Interruptions */}
      <div>
        <div className="text-gray-400 mb-1.5 font-medium">Interruptions</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <span className="text-emerald-400">Student→Teacher:</span>{" "}
            {interruptions.studentToTutor}
          </div>
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <span className="text-amber-400">Teacher→Student:</span>{" "}
            {interruptions.tutorToStudent}
          </div>
        </div>
      </div>

      {/* Response latency */}
      <div>
        <div className="text-gray-400 mb-1.5 font-medium">Response latency</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <span className="text-gray-500">Turns:</span> {responseLatency.turnCount}
          </div>
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <span className="text-gray-500">Avg:</span>{" "}
            {responseLatency.avgMs > 0
              ? `${(responseLatency.avgMs / 1000).toFixed(2)}s`
              : "—"}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <span className="text-amber-400">Hesitations:</span>{" "}
            {responseLatency.hesitationCount}
          </div>
          {responseLatency.turnsPerMinute !== undefined && (
            <div className="bg-gray-800/50 rounded px-2 py-1.5">
              <span className="text-gray-500">Turns/min:</span>{" "}
              {responseLatency.turnsPerMinute.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Tutor monologue */}
      {tutorMonologueSec !== undefined && tutorMonologueSec > 0 && (
        <div>
          <div className="text-gray-400 mb-1.5 font-medium">Tutor monologue</div>
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <span className="text-amber-400">Current/last:</span>{" "}
            {tutorMonologueSec.toFixed(1)}s
          </div>
        </div>
      )}

      {/* Eye contact */}
      <div>
        <div className="text-gray-400 mb-1.5 font-medium">Eye contact</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <span className="text-amber-400">Teacher:</span>{" "}
            {(eyeContact.tutor * 100).toFixed(0)}%
          </div>
          <div className="bg-gray-800/50 rounded px-2 py-1.5">
            <span className="text-emerald-400">Student:</span>{" "}
            {(eyeContact.student * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Video quality & pipeline */}
      <div className="flex flex-wrap gap-3 pt-1 border-t border-gray-800">
        <div>
          <span className="text-gray-500">Video quality: </span>
          <span
            className={
              videoQuality?.tutor === "low" || videoQuality?.student === "low"
                ? "text-amber-400"
                : "text-green-400"
            }
          >
            {videoQuality?.tutor === "low" || videoQuality?.student === "low"
              ? `T:${videoQuality?.tutor ?? "?"} S:${videoQuality?.student ?? "?"}`
              : "Good"}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Pipeline latency: </span>
          <span
            className={
              pipelineLatencyMs > PIPELINE_LATENCY_WARNING_MS
                ? "text-amber-400"
                : "text-green-400"
            }
          >
            {pipelineLatencyMs.toFixed(0)}ms
          </span>
        </div>
      </div>
    </div>
  );
}

interface DebugPanelProps {
  debugStats: DebugStats | null;
}

export default function DebugPanel({ debugStats }: DebugPanelProps) {
  if (!debugStats) {
    return (
      <div className="bg-gray-900/80 rounded-lg p-3 text-gray-500 text-xs">
        Debug mode: waiting for connection...
      </div>
    );
  }

  return <DebugMetricsContent debugStats={debugStats} embedded={false} />;
}
