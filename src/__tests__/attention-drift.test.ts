import { describe, it, expect } from "vitest";
import { createDriftDetector } from "@video-processor/attention-drift";

describe("createDriftDetector", () => {
  it("returns false initially (no drift at start)", () => {
    const detector = createDriftDetector();
    expect(detector.update(0.9)).toBe(false);
  });

  it("does not flag brief glance (< driftThresholdSec seconds away)", () => {
    const detector = createDriftDetector({ driftThresholdSec: 5, gazeAwayThreshold: 0.4 });
    // 4 seconds of low gaze — under threshold
    for (let i = 0; i < 4; i++) {
      detector.update(0.2);
    }
    expect(detector.getState().isDrifting).toBe(false);
  });

  it("flags drift after sustained low gaze (>= driftThresholdSec)", () => {
    const detector = createDriftDetector({ driftThresholdSec: 5, gazeAwayThreshold: 0.4 });
    for (let i = 0; i < 5; i++) {
      detector.update(0.1); // looking away
    }
    expect(detector.getState().isDrifting).toBe(true);
  });

  it("clears drift when gaze returns", () => {
    const detector = createDriftDetector({ driftThresholdSec: 5, gazeAwayThreshold: 0.4 });
    // Trigger drift
    for (let i = 0; i < 5; i++) detector.update(0.1);
    expect(detector.getState().isDrifting).toBe(true);
    // Gaze returns
    detector.update(0.9);
    expect(detector.getState().isDrifting).toBe(false);
    expect(detector.getState().consecutiveLowGazeSec).toBe(0);
  });

  it("does not drift when gaze is consistently high", () => {
    const detector = createDriftDetector({ driftThresholdSec: 5 });
    for (let i = 0; i < 20; i++) {
      detector.update(0.8); // above threshold
    }
    expect(detector.getState().isDrifting).toBe(false);
  });

  it("respects custom gazeAwayThreshold", () => {
    // With threshold 0.7, a score of 0.6 is "away"
    const detector = createDriftDetector({ driftThresholdSec: 3, gazeAwayThreshold: 0.7 });
    for (let i = 0; i < 3; i++) {
      detector.update(0.6);
    }
    expect(detector.getState().isDrifting).toBe(true);
  });

  it("resets state correctly", () => {
    const detector = createDriftDetector({ driftThresholdSec: 3 });
    for (let i = 0; i < 5; i++) detector.update(0.1);
    expect(detector.getState().isDrifting).toBe(true);

    detector.reset();
    expect(detector.getState().isDrifting).toBe(false);
    expect(detector.getState().consecutiveLowGazeSec).toBe(0);
  });

  it("consecutive counter tracks low-gaze seconds", () => {
    const detector = createDriftDetector({ driftThresholdSec: 10, gazeAwayThreshold: 0.4 });
    detector.update(0.1);
    detector.update(0.1);
    detector.update(0.1);
    expect(detector.getState().consecutiveLowGazeSec).toBe(3);
  });

  it("consecutive counter resets when gaze returns (short drift)", () => {
    const detector = createDriftDetector({ driftThresholdSec: 10 });
    detector.update(0.1);
    detector.update(0.1);
    detector.update(0.9); // look back
    expect(detector.getState().consecutiveLowGazeSec).toBe(0);
  });
});
