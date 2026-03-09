/**
 * M21: Response latency tracker.
 * Tracks time between tutor stops speaking and student starts.
 * Used for post-session latency stats and hesitation reporting.
 */

export interface ResponseLatencyStats {
  /** Average response latency in ms (all turns) */
  avgResponseLatencyMs: number;
  /** Number of tutor→student turns measured */
  turnCount: number;
  /** Number of turns where latency exceeded hesitationThresholdMs */
  hesitationCount: number;
  /** All measured latencies in ms */
  latencies: number[];
}

export interface ResponseLatencyTracker {
  onSpeechStart(role: "tutor" | "student"): void;
  onSpeechEnd(role: "tutor" | "student"): void;
  getStats(hesitationThresholdMs?: number): ResponseLatencyStats;
  reset(): void;
}

/**
 * Create a response latency tracker.
 * Wire into audio pipeline alongside InterruptionTracker.
 *
 * @param clock - optional clock fn for testing (default: Date.now)
 */
export function createResponseLatencyTracker(
  clock: () => number = Date.now
): ResponseLatencyTracker {
  let tutorStoppedAt: number | null = null;
  const latencies: number[] = [];

  return {
    onSpeechStart(role) {
      if (role === "student" && tutorStoppedAt !== null) {
        const latencyMs = clock() - tutorStoppedAt;
        if (latencyMs >= 0) {
          latencies.push(latencyMs);
        }
        tutorStoppedAt = null;
      }
      if (role === "tutor") {
        // Tutor started speaking — reset any pending stop
        tutorStoppedAt = null;
      }
    },

    onSpeechEnd(role) {
      if (role === "tutor") {
        tutorStoppedAt = clock();
      }
    },

    getStats(hesitationThresholdMs = 3000): ResponseLatencyStats {
      if (latencies.length === 0) {
        return { avgResponseLatencyMs: 0, turnCount: 0, hesitationCount: 0, latencies: [] };
      }
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const hesitationCount = latencies.filter((l) => l >= hesitationThresholdMs).length;
      return {
        avgResponseLatencyMs: Math.round(avg),
        turnCount: latencies.length,
        hesitationCount,
        latencies: [...latencies],
      };
    },

    reset() {
      tutorStoppedAt = null;
      latencies.length = 0;
    },
  };
}
