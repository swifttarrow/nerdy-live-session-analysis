/**
 * Pipeline latency instrumentation (M15).
 *
 * Tracks per-stage timing and computes p50/p95 percentiles.
 * Non-blocking; uses performance.now() by default (swappable for testing).
 */

export type StageName =
  | "frame_capture"
  | "mediapipe"
  | "gaze"
  | "smoothing"
  | "metrics_emit";

export interface StageTimings {
  stage: StageName;
  durationMs: number;
}

export interface LatencyStats {
  p50: number;
  p95: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Compute p50 and p95 from an array of durations (ms).
 * Returns zeros for empty array.
 */
export function computePercentiles(durations: number[]): LatencyStats {
  if (durations.length === 0) {
    return { p50: 0, p95: 0, min: 0, max: 0, count: 0 };
  }

  const sorted = [...durations].sort((a, b) => a - b);
  const n = sorted.length;

  const p50Idx = Math.floor(n * 0.5);
  const p95Idx = Math.min(n - 1, Math.floor(n * 0.95));

  return {
    p50: sorted[p50Idx],
    p95: sorted[p95Idx],
    min: sorted[0],
    max: sorted[n - 1],
    count: n,
  };
}

export interface PipelineLatencyTracker {
  /**
   * Mark the start of a stage. Returns a function to call on stage end,
   * which records the duration.
   */
  startStage(stage: StageName): () => void;
  /**
   * Get percentile stats for a specific stage.
   */
  getStageStats(stage: StageName): LatencyStats;
  /**
   * Get E2E (frame_capture to metrics_emit) stats.
   */
  getE2EStats(): LatencyStats;
  /**
   * Get all recorded timings (useful for debugging).
   */
  getAllTimings(): StageTimings[];
  /**
   * Reset all recorded data.
   */
  reset(): void;
}

/**
 * Create a pipeline latency tracker.
 *
 * @param clock - optional clock function for testing (default: performance.now)
 */
export function createPipelineLatencyTracker(
  clock: () => number = () => performance.now()
): PipelineLatencyTracker {
  const timings: StageTimings[] = [];
  // Track per-frame E2E start times
  const frameStartTimes: number[] = [];
  let currentFrameStart: number | null = null;

  return {
    startStage(stage: StageName): () => void {
      const start = clock();

      // Track frame-level E2E
      if (stage === "frame_capture") {
        currentFrameStart = start;
      }

      return () => {
        const duration = clock() - start;
        timings.push({ stage, durationMs: duration });

        // Record E2E when final stage completes
        if (stage === "metrics_emit" && currentFrameStart !== null) {
          frameStartTimes.push(clock() - currentFrameStart);
          currentFrameStart = null;
        }
      };
    },

    getStageStats(stage: StageName): LatencyStats {
      const stageDurations = timings
        .filter((t) => t.stage === stage)
        .map((t) => t.durationMs);
      return computePercentiles(stageDurations);
    },

    getE2EStats(): LatencyStats {
      return computePercentiles(frameStartTimes);
    },

    getAllTimings(): StageTimings[] {
      return [...timings];
    },

    reset(): void {
      timings.length = 0;
      frameStartTimes.length = 0;
      currentFrameStart = null;
    },
  };
}
