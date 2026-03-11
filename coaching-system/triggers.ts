import type { SessionMetrics } from "@metrics-engine/metrics-schema";
import type { CoachingConfig } from "./config";

export type TriggerType =
  | "student_silent"
  | "tutor_talk_dominant"
  | "low_eye_contact"
  | "interruptions_spike"   // M10: tutor→student interruptions spike
  | "student_hesitating"    // M10: student slow to respond repeatedly
  | "student_attention_drift" // M12: student sustained gaze away
  | "student_negative"      // Student shows negative emotion for threshold (10+ sec)
  | "tutor_monologue_long"  // Tutor explaining too long without student involvement
  | "turn_taking_low";      // Turn-taking frequency too low

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
 * Per-trigger accumulated state (durations, counters, timestamps).
 */
export interface TriggerState {
  /** How many consecutive seconds the student has been silent */
  studentSilentSec: number;
  /** How many consecutive seconds eye contact has been below threshold */
  lowEyeContactSec: number;
  // M10: response latency / hesitation tracking
  prevTutorSpeaking: boolean;
  prevStudentSpeaking: boolean;
  /** Timestamp (ms) when tutor last stopped speaking */
  tutorStoppedAtMs: number | null;
  /** Timestamps (ms) of recent long hesitations */
  recentHesitationTimes: number[];
  // M10: interruption spike tracking
  /** Timestamps (ms) of recent tutor→student interruptions */
  recentTutorInterruptionTimes: number[];
  // Student emotion tracking (consolidated to negative)
  consecutiveNegativeSec: number;
}

export function createInitialTriggerState(): TriggerState {
  return {
    studentSilentSec: 0,
    lowEyeContactSec: 0,
    prevTutorSpeaking: false,
    prevStudentSpeaking: false,
    tutorStoppedAtMs: null,
    recentHesitationTimes: [],
    recentTutorInterruptionTimes: [],
    consecutiveNegativeSec: 0,
  };
}

export interface TriggerStateUpdate {
  state: TriggerState;
  /** True when student responded after tutor stopped, with latency in good-wait-time range */
  goodWaitTime?: boolean;
}

/**
 * Update per-trigger state based on latest metrics.
 * Called every 1 Hz from the coaching engine.
 */
export function updateTriggerState(
  state: TriggerState,
  metrics: SessionMetrics,
  config: CoachingConfig,
  nowMs: number = Date.now()
): TriggerStateUpdate {
  const student = metrics.metrics.student;
  const tutor = metrics.metrics.tutor;

  // --- Student silent counter ---
  const studentSilentSec = student.current_speaking
    ? 0
    : state.studentSilentSec + 1;

  // --- Low eye contact counter ---
  const lowEyeContactSec =
    tutor.eye_contact_score < config.eyeContactThreshold
      ? state.lowEyeContactSec + 1
      : 0;

  // --- Response latency / hesitation tracking ---
  let { tutorStoppedAtMs, recentHesitationTimes } = state;

  const tutorJustStopped = state.prevTutorSpeaking && !tutor.current_speaking;
  const studentJustStarted = !state.prevStudentSpeaking && student.current_speaking;

  if (tutorJustStopped) {
    tutorStoppedAtMs = nowMs;
  }

  let goodWaitTime = false;
  if (studentJustStarted && tutorStoppedAtMs !== null) {
    const latencyMs = nowMs - tutorStoppedAtMs;
    if (latencyMs >= config.hesitationThresholdMs) {
      recentHesitationTimes = [...recentHesitationTimes, nowMs];
    }
    if (
      latencyMs >= (config.goodWaitTimeMinMs ?? 3_000) &&
      latencyMs <= (config.goodWaitTimeMaxMs ?? 8_000)
    ) {
      goodWaitTime = true;
    }
    tutorStoppedAtMs = null;
  }

  // Evict hesitations outside the window
  recentHesitationTimes = recentHesitationTimes.filter(
    (t) => nowMs - t <= config.hesitationWindowMs
  );

  // --- Interruption spike: evict old events ---
  const recentTutorInterruptionTimes = state.recentTutorInterruptionTimes.filter(
    (t) => nowMs - t <= config.interruptionSpikeWindowMs
  );

  // --- Student emotion: consecutive seconds (negative only) ---
  const emotionalState = student.emotional_state ?? "neutral";
  const consecutiveNegativeSec =
    emotionalState === "negative" ? state.consecutiveNegativeSec + 1 : 0;

  return {
    state: {
      studentSilentSec,
      lowEyeContactSec,
      prevTutorSpeaking: tutor.current_speaking,
      prevStudentSpeaking: student.current_speaking,
      tutorStoppedAtMs,
      recentHesitationTimes,
      recentTutorInterruptionTimes,
      consecutiveNegativeSec,
    },
    goodWaitTime,
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
    evaluate(_metrics, state, config) {
      return state.studentSilentSec >= config.studentSilentSec;
    },
  },
  {
    type: "tutor_talk_dominant",
    headline: "You're doing most of the talking",
    suggestion: "Pause and invite the student to respond",
    evaluate(metrics, _state, config) {
      // Prefer rolling-window ratio when available (more responsive for realtime)
      const ratio =
        metrics.metrics.tutor.talk_time_percent_rolling ??
        metrics.metrics.tutor.talk_time_percent;
      return ratio >= config.tutorTalkThreshold;
    },
  },
  {
    type: "low_eye_contact",
    headline: "Low eye contact detected",
    suggestion: "Engage the student to regain their attention",
    evaluate(_metrics, state, config) {
      return state.lowEyeContactSec >= config.eyeContactDurationSec;
    },
  },
  {
    type: "interruptions_spike",
    headline: "Tutor interrupting frequently",
    suggestion: "Consider letting the student finish their thought",
    evaluate(_metrics, state, config) {
      return (
        state.recentTutorInterruptionTimes.length >=
        config.interruptionSpikeThreshold
      );
    },
  },
  {
    type: "student_hesitating",
    headline: "Student hesitating repeatedly",
    suggestion: "Consider giving more think time or rephrasing the question",
    evaluate(_metrics, state, config) {
      return state.recentHesitationTimes.length >= config.hesitationCountThreshold;
    },
  },
  {
    type: "student_attention_drift",
    headline: "Student may be distracted",
    suggestion: "Try engaging with a direct question or activity change",
    evaluate(metrics, _state, _config) {
      return metrics.metrics.student.attention_drift === true;
    },
  },
  {
    type: "student_negative",
    headline: "Student shows signs of struggle",
    suggestion: "Try rephrasing, offering a hint, or switching to a simpler problem",
    evaluate(_metrics, state, config) {
      return state.consecutiveNegativeSec >= config.studentNegativeSec;
    },
  },
  {
    type: "tutor_monologue_long",
    headline: "You've been explaining for a while",
    suggestion: "Ask the student to attempt the next step",
    evaluate(metrics, _state, config) {
      const sec = metrics.metrics.tutor.tutor_monologue_sec;
      return sec !== undefined && sec >= config.tutorMonologueThresholdSec;
    },
  },
  {
    type: "turn_taking_low",
    headline: "Try involving the student more often",
    suggestion: "Pause to ask questions or have them explain their reasoning",
    evaluate(metrics, _state, config) {
      const tpm = metrics.metrics.tutor.tutor_turns_per_minute;
      if (tpm === undefined) return false;
      // Require minimum session duration before firing (avoids erroneous trigger at 1s)
      const sessionStartMs = metrics.session_start_ms;
      if (sessionStartMs !== undefined && config.turnTakingMinSessionSec > 0) {
        const sessionSec = (Date.now() - sessionStartMs) / 1000;
        if (sessionSec < config.turnTakingMinSessionSec) return false;
      }
      return tpm < config.turnTakingMinPerMinute && tpm >= 0;
    },
  },
];
