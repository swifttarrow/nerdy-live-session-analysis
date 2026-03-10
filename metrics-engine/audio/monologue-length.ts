/**
 * Tutor monologue length tracker.
 * Tracks consecutive tutor speech duration; long monologues correlate with disengagement.
 *
 * Nudge: "You've been explaining for 90 seconds — ask the student to attempt the next step."
 */

export type ParticipantRole = "tutor" | "student";

export interface MonologueStats {
  /** Current monologue duration in ms (0 if tutor not speaking) */
  currentMonologueMs: number;
  /** Longest monologue this session so far */
  maxMonologueMs: number;
  /** Last completed monologue duration in ms */
  lastMonologueMs: number;
}

export interface MonologueTracker {
  onSpeechStart(role: ParticipantRole): void;
  onSpeechEnd(role: ParticipantRole): void;
  getStats(clock?: () => number): MonologueStats;
  reset(): void;
}

/**
 * Create a monologue tracker.
 * Wire into audio pipeline alongside InterruptionTracker.
 *
 * @param clock - optional clock fn for testing (default: Date.now)
 */
export function createMonologueTracker(
  clock: () => number = Date.now
): MonologueTracker {
  let tutorSpeakingStart: number | null = null;
  let maxMonologueMs = 0;
  let lastMonologueMs = 0;

  return {
    onSpeechStart(role) {
      if (role === "student" && tutorSpeakingStart !== null) {
        // Student spoke — tutor's turn ended; record monologue duration
        const durationMs = clock() - tutorSpeakingStart;
        lastMonologueMs = durationMs;
        maxMonologueMs = Math.max(maxMonologueMs, durationMs);
        tutorSpeakingStart = null;
      }
      if (role === "tutor") {
        tutorSpeakingStart = clock();
      }
    },

    onSpeechEnd(role) {
      if (role === "tutor" && tutorSpeakingStart !== null) {
        const durationMs = clock() - tutorSpeakingStart;
        lastMonologueMs = durationMs;
        maxMonologueMs = Math.max(maxMonologueMs, durationMs);
        tutorSpeakingStart = null;
      }
    },

    getStats(now = clock) {
      const currentMonologueMs =
        tutorSpeakingStart !== null ? now() - tutorSpeakingStart : 0;
      return {
        currentMonologueMs,
        maxMonologueMs,
        lastMonologueMs,
      };
    },

    reset() {
      tutorSpeakingStart = null;
      maxMonologueMs = 0;
      lastMonologueMs = 0;
    },
  };
}
