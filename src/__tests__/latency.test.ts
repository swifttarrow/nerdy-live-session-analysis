/**
 * M15: Latency instrumentation tests.
 *
 * Uses a mock clock for deterministic assertions.
 * Verifies per-stage budget and E2E latency tracking.
 */
import { describe, it, expect } from "vitest";
import {
  createPipelineLatencyTracker,
  computePercentiles,
  type StageName,
} from "@/lib/latency/timing";

// ---------------------------------------------------------------------------
// computePercentiles (pure utility)
// ---------------------------------------------------------------------------

describe("computePercentiles", () => {
  it("returns zeros for empty array", () => {
    const stats = computePercentiles([]);
    expect(stats.p50).toBe(0);
    expect(stats.p95).toBe(0);
    expect(stats.count).toBe(0);
  });

  it("computes correct p50 for odd-length array", () => {
    // [10, 20, 30, 40, 50] sorted → p50 = index 2 = 30
    const stats = computePercentiles([50, 20, 10, 40, 30]);
    expect(stats.p50).toBe(30);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.count).toBe(5);
  });

  it("computes correct p95 for 20 samples", () => {
    // 20 values: 1..20. p95 index = floor(20*0.95) = 19 → value 20
    const values = Array.from({ length: 20 }, (_, i) => i + 1);
    const stats = computePercentiles(values);
    expect(stats.p95).toBe(20);
  });

  it("p50 <= p95 always", () => {
    const values = [100, 50, 200, 150, 300, 80, 120, 90, 250, 70];
    const stats = computePercentiles(values);
    expect(stats.p50).toBeLessThanOrEqual(stats.p95);
  });
});

// ---------------------------------------------------------------------------
// PipelineLatencyTracker with mock clock
// ---------------------------------------------------------------------------

describe("createPipelineLatencyTracker (mock clock)", () => {
  /**
   * Mock clock: returns the current value of `t` which we control.
   */
  let t = 0;
  const mockClock = () => t;

  function makeTracker() {
    t = 0;
    return createPipelineLatencyTracker(mockClock);
  }

  it("records zero duration when stage starts and ends at same tick", () => {
    const tracker = makeTracker();
    t = 100;
    const done = tracker.startStage("mediapipe");
    // No time passes
    done();
    const stats = tracker.getStageStats("mediapipe");
    expect(stats.count).toBe(1);
    expect(stats.p50).toBe(0);
  });

  it("records correct duration for mediapipe stage", () => {
    const tracker = makeTracker();
    t = 0;
    const done = tracker.startStage("mediapipe");
    t = 150; // 150ms passes
    done();

    const stats = tracker.getStageStats("mediapipe");
    expect(stats.count).toBe(1);
    expect(stats.p50).toBe(150);
    expect(stats.max).toBe(150);
  });

  it("asserts mediapipe stage within <200ms budget", () => {
    const tracker = makeTracker();
    // Simulate 10 frames of mediapipe at 80ms each
    for (let frame = 0; frame < 10; frame++) {
      t = frame * 1000;
      const done = tracker.startStage("mediapipe");
      t += 80; // 80ms processing
      done();
    }
    const stats = tracker.getStageStats("mediapipe");
    expect(stats.p50).toBeLessThan(200); // budget: <200ms
    expect(stats.p95).toBeLessThan(200);
  });

  it("asserts gaze stage within <10ms budget", () => {
    const tracker = makeTracker();
    for (let frame = 0; frame < 10; frame++) {
      t = frame * 1000;
      const done = tracker.startStage("gaze");
      t += 2; // 2ms computation
      done();
    }
    const stats = tracker.getStageStats("gaze");
    expect(stats.p95).toBeLessThan(10); // budget: <10ms
  });

  it("computes E2E latency from frame_capture to metrics_emit", () => {
    const tracker = makeTracker();
    const stages: StageName[] = ["frame_capture", "mediapipe", "gaze", "smoothing", "metrics_emit"];
    const stageDurations = [1, 80, 2, 1, 1]; // ms per stage

    // Simulate one complete frame
    t = 0;
    for (let i = 0; i < stages.length; i++) {
      const done = tracker.startStage(stages[i]);
      t += stageDurations[i];
      done();
    }

    // E2E = elapsed from frame_capture start to metrics_emit end
    // frame_capture started at 0, metrics_emit ended at 85ms
    const e2e = tracker.getE2EStats();
    expect(e2e.count).toBe(1);
    // The E2E measurement = clock() at metrics_emit end - currentFrameStart
    // = 85 - 0 = 85ms
    expect(e2e.p50).toBeCloseTo(85, 0);
  });

  it("records multiple frames and produces meaningful p50/p95", () => {
    const tracker = makeTracker();
    const frameDurations = [60, 80, 120, 70, 90, 85, 100, 75, 95, 110];

    for (let i = 0; i < frameDurations.length; i++) {
      t = i * 2000;
      const endCapture = tracker.startStage("frame_capture");
      endCapture();

      const endMediapipe = tracker.startStage("mediapipe");
      t += frameDurations[i];
      endMediapipe();

      const endGaze = tracker.startStage("gaze");
      t += 2;
      endGaze();

      const endSmooth = tracker.startStage("smoothing");
      t += 1;
      endSmooth();

      const endEmit = tracker.startStage("metrics_emit");
      t += 1;
      endEmit();
    }

    const mediapipeStats = tracker.getStageStats("mediapipe");
    expect(mediapipeStats.count).toBe(10);
    expect(mediapipeStats.p50).toBeLessThan(200); // within budget
    expect(mediapipeStats.p95).toBeLessThan(200);

    // Total timings array should have 5 stages × 10 frames = 50 entries
    expect(tracker.getAllTimings()).toHaveLength(50);
  });

  it("reset clears all recorded data", () => {
    const tracker = makeTracker();
    t = 0;
    const done = tracker.startStage("mediapipe");
    t = 100;
    done();

    tracker.reset();
    expect(tracker.getAllTimings()).toHaveLength(0);
    expect(tracker.getStageStats("mediapipe").count).toBe(0);
  });
});
