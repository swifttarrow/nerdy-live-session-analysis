"use client";

import type { SessionMetrics } from "@metrics-engine/metrics-schema";
import type { VideoQualityState } from "@video-processor/pipeline";

interface Props {
  metrics: SessionMetrics | null;
  videoQuality?: VideoQualityState | null;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 70 ? "bg-green-500" :
    pct >= 40 ? "bg-yellow-500" :
    "bg-red-500";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SpeakingIndicator({ speaking }: { speaking: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${speaking ? "bg-green-400 animate-pulse" : "bg-gray-600"}`}
    />
  );
}

function VideoQualityIndicator({ videoQuality }: { videoQuality: VideoQualityState }) {
  const lowRoles = [
    ...(videoQuality.tutor === "low" ? ["Teacher"] : []),
    ...(videoQuality.student === "low" ? ["Student"] : []),
  ];
  if (lowRoles.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-amber-500 text-xs">
      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      <span>Video quality low: {lowRoles.join(", ")}</span>
    </div>
  );
}

export default function MetricsDisplay({ metrics, videoQuality }: Props) {
  if (!metrics) {
    return (
      <div className="bg-gray-900 rounded-2xl p-4 text-gray-500 text-sm">
        Waiting for metrics...
      </div>
    );
  }

  const { tutor, student } = metrics.metrics;

  return (
    <div className="bg-gray-900 rounded-2xl p-4 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Live Metrics
        </h2>
        {videoQuality && <VideoQualityIndicator videoQuality={videoQuality} />}
      </div>

      {/* Tutor */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SpeakingIndicator speaking={tutor.current_speaking} />
          <span className="text-xs font-medium text-gray-300">Tutor</span>
        </div>
        <ScoreBar label="Eye Contact" value={tutor.eye_contact_score} />
        <ScoreBar label="Talk Time" value={tutor.talk_time_percent} />
      </div>

      <div className="border-t border-gray-800" />

      {/* Student */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SpeakingIndicator speaking={student.current_speaking} />
          <span className="text-xs font-medium text-gray-300">Student</span>
        </div>
        <ScoreBar label="Eye Contact" value={student.eye_contact_score} />
        <ScoreBar label="Talk Time" value={student.talk_time_percent} />
        {student.emotional_state && student.emotional_state !== "neutral" && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400">Emotional state:</span>
            <span
              className={
                student.emotional_state === "tired"
                  ? "text-amber-400"
                  : student.emotional_state === "frustrated"
                    ? "text-orange-400"
                    : "text-rose-400"
              }
            >
              {student.emotional_state}
            </span>
          </div>
        )}
      </div>

      {/* Student talk ratio highlight */}
      <div className="border-t border-gray-800 pt-3">
        <div className="text-xs text-gray-400 mb-1">Student talk ratio</div>
        <div className="text-lg font-bold text-white">
          {(() => {
            const total = tutor.talk_time_percent + student.talk_time_percent;
            if (total === 0) return "—";
            const ratio = Math.round((student.talk_time_percent / total) * 100);
            const color = ratio >= 35 ? "text-green-400" : "text-yellow-400";
            return <span className={color}>{ratio}%</span>;
          })()}
        </div>
      </div>
    </div>
  );
}
