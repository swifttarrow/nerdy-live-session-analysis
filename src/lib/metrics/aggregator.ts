import { validateMetrics, SessionMetrics } from "@/lib/session/metrics-schema";
import type { ParticipantRole } from "@/lib/audio/talk-time";

type StreamRole = "tutor" | "student";

interface ParticipantState {
  eyeContactScore: number;
  talkTimePercent: number;
  speaking: boolean;
  energyLevel?: number;
  attentionDrift?: boolean;
}

export interface MetricsAggregator {
  updateEyeContact(role: StreamRole, score: number): void;
  updateTalkTime(role: StreamRole, percent: number, speaking: boolean): void;
  /** M11: update energy level for a participant [0, 1] */
  updateEnergyLevel(role: StreamRole, level: number): void;
  /** M12: update attention drift flag for a participant */
  updateAttentionDrift(role: StreamRole, drifting: boolean): void;
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
      return {
        eye_contact_score: Math.round(p.eyeContactScore * 100) / 100,
        talk_time_percent: Math.round(p.talkTimePercent * 100) / 100,
        current_speaking: p.speaking,
        ...(p.energyLevel !== undefined ? { energy_level: Math.round(p.energyLevel * 100) / 100 } : {}),
        ...(p.attentionDrift !== undefined ? { attention_drift: p.attentionDrift } : {}),
      };
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

    updateTalkTime(role, percent, speaking) {
      state[role].talkTimePercent = Math.max(0, Math.min(1, percent));
      state[role].speaking = speaking;
    },

    updateEnergyLevel(role, level) {
      state[role].energyLevel = Math.max(0, Math.min(1, level));
    },

    updateAttentionDrift(role, drifting) {
      state[role].attentionDrift = drifting;
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
