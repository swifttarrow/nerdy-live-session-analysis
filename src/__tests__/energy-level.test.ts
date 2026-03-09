import { describe, it, expect } from "vitest";
import { computeRmsEnergy } from "@metrics-engine/audio/voice-energy";
import { computeExpressionEnergy } from "@video-processor/facial-expression";
import { combineEnergyScores, classifyEnergyLevel } from "@metrics-engine/energy/energy-level";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

// ---------------------------------------------------------------------------
// computeRmsEnergy (voice energy — pure function)
// ---------------------------------------------------------------------------

describe("computeRmsEnergy", () => {
  it("returns 0 for silent audio (all zeros)", () => {
    const buffer = new Float32Array(512); // all zeros
    expect(computeRmsEnergy(buffer)).toBe(0);
  });

  it("returns 1 for maximum amplitude (all ones)", () => {
    const buffer = new Float32Array(512).fill(1.0);
    expect(computeRmsEnergy(buffer)).toBeCloseTo(1.0, 5);
  });

  it("returns higher energy for louder signal", () => {
    const quiet = new Float32Array(512).fill(0.1);
    const loud = new Float32Array(512).fill(0.8);
    expect(computeRmsEnergy(loud)).toBeGreaterThan(computeRmsEnergy(quiet));
  });

  it("returns 0 for empty buffer", () => {
    expect(computeRmsEnergy(new Float32Array(0))).toBe(0);
  });

  it("output is always in [0, 1]", () => {
    // Test with values > 1 (clipped to 1)
    const buffer = new Float32Array(10).fill(2.0);
    expect(computeRmsEnergy(buffer)).toBeLessThanOrEqual(1);
    expect(computeRmsEnergy(buffer)).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// computeExpressionEnergy (facial expression — pure function)
// ---------------------------------------------------------------------------

function makeLandmarks(overrides: Record<number, Partial<NormalizedLandmark>> = {}): NormalizedLandmark[] {
  const lm: NormalizedLandmark[] = Array.from({ length: 478 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 1,
  }));
  for (const [idx, val] of Object.entries(overrides)) {
    lm[Number(idx)] = { ...lm[Number(idx)], ...val };
  }
  return lm;
}

describe("computeExpressionEnergy", () => {
  it("returns 0 for insufficient landmarks (< 478)", () => {
    const short = Array.from({ length: 10 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
    expect(computeExpressionEnergy(short)).toBe(0);
  });

  it("returns a score in [0, 1] for a neutral face", () => {
    // Default landmarks: forehead=10, chin=152 at same y → degenerate face height → returns 0
    // Set forehead above chin
    const lm = makeLandmarks({
      10: { y: 0.2 },  // forehead
      152: { y: 0.8 }, // chin
      // lips close together (neutral)
      13: { y: 0.52 },
      14: { y: 0.54 },
      // brows at same level as eyes (neutral raise)
      107: { y: 0.45 },
      336: { y: 0.45 },
      133: { y: 0.48 },
      362: { y: 0.48 },
    });
    const score = computeExpressionEnergy(lm);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("animated face (open mouth) scores higher than neutral face", () => {
    const baseLm = {
      10: { y: 0.2 },
      152: { y: 0.8 },
      107: { y: 0.42 },
      336: { y: 0.42 },
      133: { y: 0.47 },
      362: { y: 0.47 },
    };

    const neutralLm = makeLandmarks({
      ...baseLm,
      13: { y: 0.52 },  // closed mouth
      14: { y: 0.54 },
    });

    const animatedLm = makeLandmarks({
      ...baseLm,
      13: { y: 0.5 },   // open mouth
      14: { y: 0.62 },  // large gap
    });

    const neutralScore = computeExpressionEnergy(neutralLm);
    const animatedScore = computeExpressionEnergy(animatedLm);
    expect(animatedScore).toBeGreaterThan(neutralScore);
  });
});

// ---------------------------------------------------------------------------
// combineEnergyScores
// ---------------------------------------------------------------------------

describe("combineEnergyScores", () => {
  it("returns 0 when both inputs are null", () => {
    expect(combineEnergyScores({ voiceEnergy: null, expressionEnergy: null })).toBe(0);
  });

  it("returns voiceEnergy when expression is null", () => {
    expect(combineEnergyScores({ voiceEnergy: 0.8, expressionEnergy: null })).toBeCloseTo(0.8);
  });

  it("returns expressionEnergy when voice is null", () => {
    expect(combineEnergyScores({ voiceEnergy: null, expressionEnergy: 0.6 })).toBeCloseTo(0.6);
  });

  it("combines with default weights (0.6 voice + 0.4 expression)", () => {
    const result = combineEnergyScores({ voiceEnergy: 1.0, expressionEnergy: 0.0 });
    // (0.6 * 1.0 + 0.4 * 0.0) / 1.0 = 0.6
    expect(result).toBeCloseTo(0.6, 5);
  });

  it("output is always in [0, 1]", () => {
    expect(combineEnergyScores({ voiceEnergy: 0.7, expressionEnergy: 0.9 })).toBeLessThanOrEqual(1);
    expect(combineEnergyScores({ voiceEnergy: 0.7, expressionEnergy: 0.9 })).toBeGreaterThanOrEqual(0);
  });

  it("higher inputs produce higher combined score", () => {
    const low = combineEnergyScores({ voiceEnergy: 0.1, expressionEnergy: 0.1 });
    const high = combineEnergyScores({ voiceEnergy: 0.9, expressionEnergy: 0.9 });
    expect(high).toBeGreaterThan(low);
  });
});

// ---------------------------------------------------------------------------
// classifyEnergyLevel
// ---------------------------------------------------------------------------

describe("classifyEnergyLevel", () => {
  it("classifies 0 as low", () => {
    expect(classifyEnergyLevel(0)).toBe("low");
  });

  it("classifies 0.3 as low", () => {
    expect(classifyEnergyLevel(0.3)).toBe("low");
  });

  it("classifies 0.5 as medium", () => {
    expect(classifyEnergyLevel(0.5)).toBe("medium");
  });

  it("classifies 0.8 as high", () => {
    expect(classifyEnergyLevel(0.8)).toBe("high");
  });

  it("classifies 1 as high", () => {
    expect(classifyEnergyLevel(1)).toBe("high");
  });
});
