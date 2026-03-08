import { validateMetrics, SessionMetrics } from "@/lib/session/metrics-schema";
import type { ParticipantRole } from "@/lib/audio/talk-time";

type StreamRole = "tutor" | "student";

interface ParticipantState {
  eyeContactScore: number;
  talkTimePercent: number;
  speaking: boolean;
}

export interface MetricsAggregator {
  updateEyeContact(role: StreamRole, score: number): void;
  updateTalkTime(role: StreamRole, percent: number, speaking: boolean): void;
  start(): void;
  stop(): void;
}

/**
 * Combines eye contact and talk-time outputs; emits validated SessionMetrics at 1 Hz.
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
    const payload = {
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      metrics: {
        tutor: {
          eye_contact_score: Math.round(state.tutor.eyeContactScore * 100) / 100,
          talk_time_percent: Math.round(state.tutor.talkTimePercent * 100) / 100,
          current_speaking: state.tutor.speaking,
        },
        student: {
          eye_contact_score: Math.round(state.student.eyeContactScore * 100) / 100,
          talk_time_percent: Math.round(state.student.talkTimePercent * 100) / 100,
          current_speaking: state.student.speaking,
        },
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
