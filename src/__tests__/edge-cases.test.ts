/**
 * Edge case tests for pipeline components.
 * Covers: no face, no audio, poor video, dropped frames.
 */
import { describe, it, expect } from "vitest";
import { deriveGazeScore } from "@video-processor/gaze";
import { createEmaSmoother } from "@video-processor/smoothing";
import { computeExpressionEnergy } from "@video-processor/facial-expression";
import { computeRmsEnergy } from "@metrics-engine/audio/voice-energy";
import { combineEnergyScores } from "@metrics-engine/energy/energy-level";
import { createDriftDetector } from "@video-processor/attention-drift";
import { validateMetrics } from "@metrics-engine/metrics-schema";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

// ---------------------------------------------------------------------------
// No face detected
// ---------------------------------------------------------------------------

describe("no face detected", () => {
  it("deriveGazeScore returns null when no landmarks present", () => {
    const result = {
      faceLandmarks: [],
      faceBlendshapes: [],
      facialTransformationMatrixes: [],
    } as unknown as FaceLandmarkerResult;
    expect(deriveGazeScore(result)).toBeNull();
  });

  it("EMA smoother handles null (no face) without crashing", () => {
    const smoother = createEmaSmoother({ alpha: 0.25, missingStrategy: "last" });
    // No face for 10 frames
    for (let i = 0; i < 10; i++) {
      expect(() => smoother.update(null)).not.toThrow();
    }
  });

  it("EMA smoother with missingStrategy=zero trends toward 0 on no face", () => {
    const smoother = createEmaSmoother({ alpha: 0.5, missingStrategy: "zero" });
    smoother.update(1.0); // establish baseline
    smoother.update(null);
    smoother.update(null);
    // After 2 missing updates, score should be below 0.5
    expect(smoother.current()).toBeLessThan(0.5);
  });

  it("computeExpressionEnergy returns 0 for empty landmarks", () => {
    expect(computeExpressionEnergy([])).toBe(0);
  });

  it("combineEnergyScores handles no face (null expression) gracefully", () => {
    const result = combineEnergyScores({ voiceEnergy: 0.5, expressionEnergy: null });
    expect(result).toBeCloseTo(0.5);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// No audio
// ---------------------------------------------------------------------------

describe("no audio / silent audio", () => {
  it("computeRmsEnergy returns 0 for silent buffer", () => {
    const silent = new Float32Array(512); // all zeros
    expect(computeRmsEnergy(silent)).toBe(0);
  });

  it("combineEnergyScores handles no audio (null voice) gracefully", () => {
    const result = combineEnergyScores({ voiceEnergy: null, expressionEnergy: 0.7 });
    expect(result).toBeCloseTo(0.7);
  });

  it("combineEnergyScores returns 0 when both voice and expression unavailable", () => {
    expect(combineEnergyScores({ voiceEnergy: null, expressionEnergy: null })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Poor video quality / insufficient landmarks
// ---------------------------------------------------------------------------

describe("poor video quality", () => {
  it("deriveGazeScore returns null for partial landmarks (< 478)", () => {
    const result = {
      faceLandmarks: [Array.from({ length: 100 }, () => ({ x: 0.5, y: 0.5, z: 0 }))],
      faceBlendshapes: [],
      facialTransformationMatrixes: [],
    } as unknown as FaceLandmarkerResult;
    expect(deriveGazeScore(result)).toBeNull();
  });

  it("computeExpressionEnergy returns 0 for partial landmarks", () => {
    const partial = Array.from({ length: 200 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
    expect(computeExpressionEnergy(partial)).toBe(0);
  });

  it("drift detector handles intermittent gaze (null-equivalent as low score)", () => {
    const detector = createDriftDetector({ driftThresholdSec: 5 });
    // Simulate alternating good/bad frames over 10s — no sustained drift
    for (let i = 0; i < 10; i++) {
      detector.update(i % 2 === 0 ? 0.8 : 0.3);
    }
    // Alternating pattern → resets every other frame → no drift
    expect(detector.getState().isDrifting).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Dropped frames / pipeline continuity
// ---------------------------------------------------------------------------

describe("dropped frames", () => {
  it("EMA smoother continues without accumulation on dropped frames (null)", () => {
    const smoother = createEmaSmoother({ alpha: 0.25, missingStrategy: "last" });
    smoother.update(0.8); // establish baseline

    // Simulate many dropped frames
    for (let i = 0; i < 50; i++) {
      smoother.update(null); // dropped
    }

    // Score should remain stable (last strategy)
    expect(smoother.current()).toBeCloseTo(0.8, 1);
  });

  it("drift detector consecutive counter does not accumulate on recovered frames", () => {
    const detector = createDriftDetector({ driftThresholdSec: 5 });
    // 3 dropped/away frames
    detector.update(0.1);
    detector.update(0.1);
    detector.update(0.1);
    // Frame recovered
    detector.update(0.9);
    // Back to low for 3 more
    detector.update(0.1);
    detector.update(0.1);
    detector.update(0.1);
    // Total consecutive = 3 (reset at frame 4), still under 5s threshold
    expect(detector.getState().isDrifting).toBe(false);
    expect(detector.getState().consecutiveLowGazeSec).toBe(3);
  });

  it("metrics schema validation passes with optional fields absent", () => {
    const payload = {
      timestamp: new Date().toISOString(),
      session_id: "test",
      metrics: {
        tutor: { eye_contact_score: 0.8, talk_time_percent: 0.6, current_speaking: true },
        student: { eye_contact_score: 0.7, talk_time_percent: 0.4, current_speaking: false },
      },
    };
    expect(validateMetrics(payload)).not.toBeNull();
  });

  it("metrics schema accepts optional energy_level and attention_drift", () => {
    const payload = {
      timestamp: new Date().toISOString(),
      session_id: "test",
      metrics: {
        tutor: {
          eye_contact_score: 0.8,
          talk_time_percent: 0.6,
          current_speaking: true,
          energy_level: 0.7,
          attention_drift: false,
        },
        student: {
          eye_contact_score: 0.7,
          talk_time_percent: 0.4,
          current_speaking: false,
          energy_level: 0.4,
          attention_drift: true,
        },
      },
    };
    const result = validateMetrics(payload);
    expect(result).not.toBeNull();
    expect(result?.metrics.student.attention_drift).toBe(true);
    expect(result?.metrics.tutor.energy_level).toBeCloseTo(0.7);
  });
});
