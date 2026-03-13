"use client";

import { useState } from "react";
import type { SessionMetrics } from "@metrics-engine/metrics-schema";
import type { VideoQualityState } from "@video-processor/pipeline";
import EmotionIcon, { EMOTION_COLORS } from "@/components/EmotionIcon";
import { DebugMetricsContent } from "@/components/DebugPanel";
import type { DebugStats } from "@/hooks/useSessionRoom";
import { SCORE_THRESHOLDS } from "@/lib/constants";

interface Props {
  metrics: SessionMetrics | null;
  videoQuality?: VideoQualityState | null;
  /** When provided, debug sections are shown inline */
  debugStats?: DebugStats | null;
  /** When false, metrics show placeholders */
  studentJoined?: boolean;
}

function ScoreBar({
  label,
  value,
  faceDetected = true,
  na = false,
}: {
  label: string;
  value: number;
  faceDetected?: boolean;
  /** When true, show "n/a" instead of value (student not joined) */
  na?: boolean;
}) {
  const pct = Math.round(value * 100);
  const noFace = !na && !faceDetected && pct === 0;
  const showNa = na;
  const color =
    showNa || noFace
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
        <span className={showNa || noFace ? "text-gray-500" : "text-white"}>
          {showNa ? "n/a" : noFace ? "No face" : `${pct}%`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: showNa || noFace ? "0%" : `${pct}%` }}
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

/** Additional metrics from schema (energy, attention drift, rolling talk, etc.) */
function AdditionalMetricsContent({ metrics, studentJoined }: { metrics: SessionMetrics; studentJoined: boolean }) {
  const tutor = metrics.metrics.tutor;
  const student = metrics.metrics.student;
  const hasAny =
    tutor.energy_level !== undefined ||
    tutor.attention_drift !== undefined ||
    tutor.talk_time_percent_rolling !== undefined ||
    tutor.tutor_monologue_sec !== undefined ||
    tutor.tutor_turns_per_minute !== undefined ||
    student.energy_level !== undefined ||
    student.attention_drift !== undefined ||
    student.talk_time_percent_rolling !== undefined;

  if (!hasAny) return null;

  return (
    <div className="space-y-3 text-xs">
      {tutor.energy_level !== undefined && (
        <div className="flex justify-between">
          <span className="text-gray-400">Tutor energy:</span>
          <span className="text-gray-300">{Math.round(tutor.energy_level * 100)}%</span>
        </div>
      )}
      {tutor.attention_drift !== undefined && (
        <div className="flex justify-between">
          <span className="text-gray-400">Tutor attention drift:</span>
          <span className={tutor.attention_drift ? "text-amber-400" : "text-gray-300"}>
            {tutor.attention_drift ? "Yes" : "No"}
          </span>
        </div>
      )}
      {tutor.talk_time_percent_rolling !== undefined && studentJoined && (
        <div className="flex justify-between">
          <span className="text-gray-400">Tutor talk (rolling):</span>
          <span className="text-gray-300">{Math.round(tutor.talk_time_percent_rolling * 100)}%</span>
        </div>
      )}
      {tutor.tutor_monologue_sec !== undefined && (
        <div className="flex justify-between">
          <span className="text-gray-400">Tutor monologue:</span>
          <span className="text-gray-300">{tutor.tutor_monologue_sec.toFixed(1)}s</span>
        </div>
      )}
      {tutor.tutor_turns_per_minute !== undefined && (
        <div className="flex justify-between">
          <span className="text-gray-400">Tutor turns/min:</span>
          <span className="text-gray-300">{tutor.tutor_turns_per_minute.toFixed(1)}</span>
        </div>
      )}
      {student.energy_level !== undefined && (
        <div className="flex justify-between">
          <span className="text-gray-400">Student energy:</span>
          <span className="text-gray-300">{Math.round(student.energy_level * 100)}%</span>
        </div>
      )}
      {student.attention_drift !== undefined && (
        <div className="flex justify-between">
          <span className="text-gray-400">Student attention drift:</span>
          <span className={student.attention_drift ? "text-amber-400" : "text-gray-300"}>
            {student.attention_drift ? "Yes" : "No"}
          </span>
        </div>
      )}
      {student.talk_time_percent_rolling !== undefined && studentJoined && (
        <div className="flex justify-between">
          <span className="text-gray-400">Student talk (rolling):</span>
          <span className="text-gray-300">{Math.round(student.talk_time_percent_rolling * 100)}%</span>
        </div>
      )}
    </div>
  );
}

export default function MetricsDisplay({
  metrics,
  videoQuality,
  debugStats,
  studentJoined = true,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!metrics && !debugStats) {
    return (
      <div className="bg-gray-900 rounded-2xl p-4 text-gray-500 text-sm">
        Waiting for metrics...
      </div>
    );
  }

  const tutor = metrics?.metrics?.tutor;
  const student = metrics?.metrics?.student;

  const hasOptionalSchemaFields =
    metrics &&
    (tutor!.energy_level !== undefined ||
      tutor!.attention_drift !== undefined ||
      tutor!.talk_time_percent_rolling !== undefined ||
      tutor!.tutor_monologue_sec !== undefined ||
      tutor!.tutor_turns_per_minute !== undefined ||
      student!.energy_level !== undefined ||
      student!.attention_drift !== undefined ||
      student!.talk_time_percent_rolling !== undefined);
  const hasAdditionalContent = !!debugStats || !!hasOptionalSchemaFields || !!metrics;

  return (
    <div className="bg-gray-900 rounded-2xl p-4 space-y-5">
      <div className="flex items-center justify-between gap-2 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Live Metrics
        </h2>
        <div className="flex items-center gap-2">
          {videoQuality && <VideoQualityIndicator videoQuality={videoQuality} />}
          {hasAdditionalContent && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>

      {metrics ? (
        <>
          {/* Tutor */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SpeakingIndicator speaking={tutor!.current_speaking} />
              <span className="text-xs font-medium text-gray-300">Tutor</span>
            </div>
            <ScoreBar
              label="Eye Contact"
              value={tutor!.eye_contact_score}
              faceDetected={tutor!.face_detected}
              na={!studentJoined}
            />
            <ScoreBar
              label="Talk Time"
              value={tutor!.talk_time_percent}
              na={!studentJoined}
            />
          </div>

          <div className="border-t border-gray-800" />

          {/* Student */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SpeakingIndicator speaking={student!.current_speaking} />
              <span className="text-xs font-medium text-gray-300">Student</span>
            </div>
            <ScoreBar
              label="Eye Contact"
              value={student!.eye_contact_score}
              faceDetected={student!.face_detected}
              na={!studentJoined}
            />
            <ScoreBar
              label="Talk Time"
              value={student!.talk_time_percent}
              na={!studentJoined}
            />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Emotional state:</span>
              <span className="flex items-center gap-1.5">
                {studentJoined ? (
                  <>
                    <EmotionIcon state={student!.emotional_state} size="sm" />
                    <span
                      className={
                        EMOTION_COLORS[student!.emotional_state ?? "neutral"] ??
                        "text-gray-400"
                      }
                    >
                      {(student!.emotional_state ?? "neutral").replace(/^./, (c) =>
                        c.toUpperCase()
                      )}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </span>
            </div>
          </div>

          {/* Student talk ratio highlight */}
          <div className="border-t border-gray-800 pt-3">
            <div className="text-xs text-gray-400 mb-1">Student talk ratio</div>
            <div className="text-lg font-bold text-white">
              {!studentJoined ? (
                <span className="text-gray-500">-</span>
              ) : (() => {
                const total =
                  tutor!.talk_time_percent + student!.talk_time_percent;
                if (total === 0) return "—";
                const ratio = Math.round(
                  (student!.talk_time_percent / total) * 100
                );
                const color =
                  ratio >= SCORE_THRESHOLDS.STUDENT_TALK_RATIO_GOOD
                    ? "text-green-400"
                    : "text-yellow-400";
                return <span className={color}>{ratio}%</span>;
              })()}
            </div>
          </div>
        </>
      ) : (
        <div className="text-gray-500 text-sm">Waiting for metrics...</div>
      )}

      {expanded && hasAdditionalContent && (
        <>
          <div className="border-t border-gray-800" />
          {debugStats && <DebugMetricsContent debugStats={debugStats} embedded />}
          {metrics && hasOptionalSchemaFields && (
            <>
              {debugStats && <div className="border-t border-gray-800" />}
              <AdditionalMetricsContent metrics={metrics} studentJoined={studentJoined} />
            </>
          )}
          {metrics && !debugStats && !hasOptionalSchemaFields && (
            <div className="text-xs text-gray-500">
              Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
