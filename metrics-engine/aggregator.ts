import { validateMetrics, SessionMetrics } from "./metrics-schema";
import type { ParticipantRole } from "./audio/talk-time";

type StreamRole = "tutor" | "student";

interface ParticipantState {
  eyeContactScore: number;
  talkTimePercent: number;
  speaking: boolean;
  energyLevel?: number;
  attentionDrift?: boolean;
  emotionalState?: import("./metrics-schema").EmotionalState;
  talkTimePercentRolling?: number;
  tutorMonologueSec?: number;
  tutorTurnsPerMinute?: number;
}

export interface MetricsAggregator {
  updateEyeContact(role: StreamRole, score: number): void;
  updateTalkTime(
    role: StreamRole,
    percent: number,
    speaking: boolean,
    options?: {
      percentRolling?: number;
      tutorMonologueSec?: number;
      tutorTurnsPerMinute?: number;
      rollingState?: { tutor: number; student: number };
    }
  ): void;
  /** M11: update energy level for a participant [0, 1] */
  updateEnergyLevel(role: StreamRole, level: number): void;
  /** M12: update attention drift flag for a participant */
  updateAttentionDrift(role: StreamRole, drifting: boolean): void;
  /** Update student emotional state (tired, frustrated, defeated, neutral) */
  updateEmotionalState(role: StreamRole, state: import("./metrics-schema").EmotionalState): void;
  start(): void;
  stop(): void;
}

/**
 * Combines eye contact, talk-time, energy level, and attention drift outputs;
 * emits validated SessionMetrics at 1 Hz.
 */
export function createMetricsAggregator(
  sessionId: string,
  onMetrics: (metrics: SessionMetrics) => void
): MetricsAggregator {
  const state: Record<StreamRole, ParticipantState> = {
    tutor: { eyeContactScore: 0, talkTimePercent: 0, speaking: false },
    student: { eyeContactScore: 0, talkTimePercent: 0, speaking: false },
  };

  let intervalId: ReturnType<typeof setInterval> | null = null;

  function emit() {
    const buildParticipant = (role: StreamRole) => {
      const p = state[role];
      const base: Record<string, unknown> = {
        eye_contact_score: Math.round(p.eyeContactScore * 100) / 100,
        talk_time_percent: Math.round(p.talkTimePercent * 100) / 100,
        current_speaking: p.speaking,
        ...(p.energyLevel !== undefined ? { energy_level: Math.round(p.energyLevel * 100) / 100 } : {}),
        ...(p.attentionDrift !== undefined ? { attention_drift: p.attentionDrift } : {}),
        ...(p.emotionalState !== undefined ? { emotional_state: p.emotionalState } : {}),
        ...(p.talkTimePercentRolling !== undefined ? { talk_time_percent_rolling: Math.round(p.talkTimePercentRolling * 100) / 100 } : {}),
      };
      if (role === "tutor") {
        if (p.tutorMonologueSec !== undefined) base.tutor_monologue_sec = Math.round(p.tutorMonologueSec * 10) / 10;
        if (p.tutorTurnsPerMinute !== undefined) base.tutor_turns_per_minute = Math.round(p.tutorTurnsPerMinute * 10) / 10;
      }
      return base;
    };

    const payload = {
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      metrics: {
        tutor: buildParticipant("tutor"),
        student: buildParticipant("student"),
      },
    };

    const validated = validateMetrics(payload);
    if (validated) {
      onMetrics(validated);
    }
  }

  return {
    updateEyeContact(role, score) {
      state[role].eyeContactScore = Math.max(0, Math.min(1, score));
    },

    updateTalkTime(role, percent, speaking, options) {
      state[role].talkTimePercent = Math.max(0, Math.min(1, percent));
      state[role].speaking = speaking;
      if (options?.percentRolling !== undefined) {
        state[role].talkTimePercentRolling = Math.max(0, Math.min(1, options.percentRolling));
      }
      if (options?.rollingState) {
        state.tutor.talkTimePercentRolling = Math.max(0, Math.min(1, options.rollingState.tutor));
        state.student.talkTimePercentRolling = Math.max(0, Math.min(1, options.rollingState.student));
      }
      if (options?.tutorMonologueSec !== undefined) {
        state.tutor.tutorMonologueSec = Math.max(0, options.tutorMonologueSec);
      }
      if (options?.tutorTurnsPerMinute !== undefined) {
        state.tutor.tutorTurnsPerMinute = Math.max(0, options.tutorTurnsPerMinute);
      }
    },

    updateEnergyLevel(role, level) {
      state[role].energyLevel = Math.max(0, Math.min(1, level));
    },

    updateAttentionDrift(role, drifting) {
      state[role].attentionDrift = drifting;
    },

    updateEmotionalState(role, emotionalState) {
      state[role].emotionalState = emotionalState;
    },

    start() {
      if (intervalId) return;
      intervalId = setInterval(emit, 1000); // 1 Hz
    },

    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
}
