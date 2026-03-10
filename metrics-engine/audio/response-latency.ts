/**
 * M21: Response latency tracker.
 * Tracks time between tutor stops speaking and student starts.
 * Used for post-session latency stats and hesitation reporting.
 */

export interface TurnRecord {
  timestampMs: number;
  latencyMs: number;
}

export interface ResponseLatencyStats {
  /** Average response latency in ms (all turns) */
  avgResponseLatencyMs: number;
  /** Number of tutor→student turns measured */
  turnCount: number;
  /** Number of turns where latency exceeded hesitationThresholdMs */
  hesitationCount: number;
  /** All measured latencies in ms */
  latencies: number[];
  /** Turns per minute in rolling window (when windowMs provided to getStats) */
  turnsPerMinute?: number;
}

export interface ResponseLatencyTracker {
  onSpeechStart(role: "tutor" | "student"): void;
  onSpeechEnd(role: "tutor" | "student"): void;
  getStats(hesitationThresholdMs?: number, windowMs?: number): ResponseLatencyStats;
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
  const turns: TurnRecord[] = [];

  return {
    onSpeechStart(role) {
      if (role === "student" && tutorStoppedAt !== null) {
        const now = clock();
        const latencyMs = now - tutorStoppedAt;
        if (latencyMs >= 0) {
          turns.push({ timestampMs: now, latencyMs });
        }
        tutorStoppedAt = null;
      }
      if (role === "tutor") {
        tutorStoppedAt = null;
      }
    },

    onSpeechEnd(role) {
      if (role === "tutor") {
        tutorStoppedAt = clock();
      }
    },

    getStats(hesitationThresholdMs = 3000, windowMs?: number): ResponseLatencyStats {
      const latencies = turns.map((t) => t.latencyMs);
      if (latencies.length === 0) {
        return {
          avgResponseLatencyMs: 0,
          turnCount: 0,
          hesitationCount: 0,
          latencies: [],
          ...(windowMs !== undefined ? { turnsPerMinute: 0 } : {}),
        };
      }
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const hesitationCount = latencies.filter((l) => l >= hesitationThresholdMs).length;

      let turnsPerMinute: number | undefined;
      if (windowMs !== undefined && windowMs > 0) {
        const now = clock();
        const cutoff = now - windowMs;
        const turnsInWindow = turns.filter((t) => t.timestampMs >= cutoff).length;
        const windowMinutes = windowMs / 60_000;
        turnsPerMinute = windowMinutes > 0 ? turnsInWindow / windowMinutes : 0;
      }

      return {
        avgResponseLatencyMs: Math.round(avg),
        turnCount: latencies.length,
        hesitationCount,
        latencies: [...latencies],
        ...(turnsPerMinute !== undefined ? { turnsPerMinute } : {}),
      };
    },

    reset() {
      tutorStoppedAt = null;
      turns.length = 0;
    },
  };
}
