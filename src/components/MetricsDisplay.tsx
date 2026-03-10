"use client";

import type { SessionMetrics } from "@metrics-engine/metrics-schema";
import type { VideoQualityState } from "@video-processor/pipeline";
import EmotionIcon, { EMOTION_COLORS } from "@/components/EmotionIcon";
import { SCORE_THRESHOLDS } from "@/lib/constants";

interface Props {
  metrics: SessionMetrics | null;
  videoQuality?: VideoQualityState | null;
}

function ScoreBar({
  label,
  value,
  faceDetected = true,
}: {
  label: string;
  value: number;
  faceDetected?: boolean;
}) {
  const pct = Math.round(value * 100);
  const noFace = !faceDetected && pct === 0;
  const color =
    noFace
      ? "bg-gray-600"
      : pct >= SCORE_THRESHOLDS.GOOD
        ? "bg-green-500"
        : pct >= SCORE_THRESHOLDS.FAIR
          ? "bg-yellow-500"
          : "bg-red-500";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={noFace ? "text-gray-500" : "text-white"}>
          {noFace ? "No face" : `${pct}%`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: noFace ? "0%" : `${pct}%` }}
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
        <ScoreBar
          label="Eye Contact"
          value={tutor.eye_contact_score}
          faceDetected={tutor.face_detected}
        />
        <ScoreBar label="Talk Time" value={tutor.talk_time_percent} />
      </div>

      <div className="border-t border-gray-800" />

      {/* Student */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SpeakingIndicator speaking={student.current_speaking} />
          <span className="text-xs font-medium text-gray-300">Student</span>
        </div>
        <ScoreBar
          label="Eye Contact"
          value={student.eye_contact_score}
          faceDetected={student.face_detected}
        />
        <ScoreBar label="Talk Time" value={student.talk_time_percent} />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Emotional state:</span>
          <span className="flex items-center gap-1.5">
            <EmotionIcon state={student.emotional_state} size="sm" />
            <span
              className={
                EMOTION_COLORS[student.emotional_state ?? "neutral"] ??
                "text-gray-400"
              }
            >
              {(student.emotional_state ?? "neutral").replace(/^./, (c) =>
                c.toUpperCase()
              )}
            </span>
          </span>
        </div>
      </div>

      {/* Student talk ratio highlight */}
      <div className="border-t border-gray-800 pt-3">
        <div className="text-xs text-gray-400 mb-1">Student talk ratio</div>
        <div className="text-lg font-bold text-white">
          {(() => {
            const total = tutor.talk_time_percent + student.talk_time_percent;
            if (total === 0) return "—";
            const ratio = Math.round((student.talk_time_percent / total) * 100);
            const color =
              ratio >= SCORE_THRESHOLDS.STUDENT_TALK_RATIO_GOOD
                ? "text-green-400"
                : "text-yellow-400";
            return <span className={color}>{ratio}%</span>;
          })()}
        </div>
      </div>
    </div>
  );
}
