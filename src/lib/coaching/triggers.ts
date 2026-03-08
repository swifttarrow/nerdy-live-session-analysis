import type { SessionMetrics } from "@/lib/session/metrics-schema";
import type { CoachingConfig } from "./config";

export type TriggerType =
  | "student_silent"
  | "tutor_talk_dominant"
  | "low_eye_contact";

export interface Trigger {
  type: TriggerType;
  headline: string;
  suggestion: string;
  /**
   * Returns true if this trigger's condition is currently met,
   * given current metrics and accumulated state.
   */
  evaluate(
    metrics: SessionMetrics,
    state: TriggerState,
    config: CoachingConfig
  ): boolean;
}

/**
 * Per-trigger accumulated state (durations, counters).
 */
export interface TriggerState {
  /** How many consecutive seconds the student has been silent */
  studentSilentSec: number;
  /** How many consecutive seconds eye contact has been below threshold */
  lowEyeContactSec: number;
}

export function createInitialTriggerState(): TriggerState {
  return {
    studentSilentSec: 0,
    lowEyeContactSec: 0,
  };
}

/**
 * Update per-trigger state based on latest metrics.
 * Called every 1 Hz from the coaching engine.
 */
export function updateTriggerState(
  state: TriggerState,
  metrics: SessionMetrics,
  config: CoachingConfig
): TriggerState {
  const student = metrics.metrics.student;
  const tutor = metrics.metrics.tutor;

  return {
    studentSilentSec: student.current_speaking
      ? 0
      : state.studentSilentSec + 1,
    lowEyeContactSec:
      tutor.eye_contact_score < config.eyeContactThreshold
        ? state.lowEyeContactSec + 1
        : 0,
  };
}

/**
 * All coaching triggers with thresholds per ONE_PAGER.
 */
export const TRIGGERS: Trigger[] = [
  {
    type: "student_silent",
    headline: "Student has been silent",
    suggestion: "Try asking a comprehension check question",
    evaluate(metrics, state, config) {
      return state.studentSilentSec >= config.studentSilentSec;
    },
  },
  {
    type: "tutor_talk_dominant",
    headline: "You're doing most of the talking",
    suggestion: "Pause and invite the student to respond",
    evaluate(metrics, _state, config) {
      return metrics.metrics.tutor.talk_time_percent >= config.tutorTalkThreshold;
    },
  },
  {
    type: "low_eye_contact",
    headline: "Low eye contact detected",
    suggestion: "Engage the student to regain their attention",
    evaluate(metrics, state, config) {
      return state.lowEyeContactSec >= config.eyeContactDurationSec;
    },
  },
];
