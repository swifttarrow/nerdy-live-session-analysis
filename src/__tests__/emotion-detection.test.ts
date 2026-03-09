import { describe, it, expect } from "vitest";
import { detectEmotion, computeEmotionScores } from "@video-processor/emotion-detection";

/** Create mock landmarks with all 478 points (we only use a subset) */
function mockLandmarks(overrides: Partial<Record<number, { x: number; y: number; z: number }>> = {}) {
  const lm: { x: number; y: number; z: number }[] = [];
  for (let i = 0; i < 478; i++) {
    const o = overrides[i];
    lm.push(o ?? { x: 0.5, y: 0.5, z: 0 });
  }
  return lm;
}

describe("emotion-detection", () => {
  it("returns neutral when landmarks insufficient", () => {
    const result = detectEmotion({ faceLandmarks: [[]] } as any);
    expect(result).toBe("neutral");
  });

  it("returns neutral when no face", () => {
    const result = detectEmotion({ faceLandmarks: undefined } as any);
    expect(result).toBe("neutral");
  });

  it("computeEmotionScores returns scores in [0,1]", () => {
    const lm = mockLandmarks();
    const scores = computeEmotionScores(lm);
    expect(scores.tired).toBeGreaterThanOrEqual(0);
    expect(scores.tired).toBeLessThanOrEqual(1);
    expect(scores.frustrated).toBeGreaterThanOrEqual(0);
    expect(scores.frustrated).toBeLessThanOrEqual(1);
    expect(scores.defeated).toBeGreaterThanOrEqual(0);
    expect(scores.defeated).toBeLessThanOrEqual(1);
  });

  it("detectEmotion returns valid EmotionalState", () => {
    const lm = mockLandmarks();
    const result = detectEmotion({
      faceLandmarks: [lm],
    } as any);
    expect(["neutral", "tired", "frustrated", "defeated"]).toContain(result);
  });

  it("tired: low eye openness increases tired score", () => {
    const lm = mockLandmarks();
    // 159=left eye top, 145=left eye bottom - make them close (droopy)
    lm[159] = { x: 0.5, y: 0.4, z: 0 };
    lm[145] = { x: 0.5, y: 0.41, z: 0 }; // tiny gap
    lm[386] = { x: 0.5, y: 0.4, z: 0 };
    lm[374] = { x: 0.5, y: 0.41, z: 0 };
    lm[10] = { x: 0.5, y: 0.2, z: 0 };  // forehead
    lm[152] = { x: 0.5, y: 0.8, z: 0 }; // chin
    const scores = computeEmotionScores(lm);
    expect(scores.tired).toBeGreaterThan(0);
  });

  it("frustrated: brow down increases frustrated score", () => {
    const lm = mockLandmarks();
    lm[10] = { x: 0.5, y: 0.2, z: 0 };
    lm[152] = { x: 0.5, y: 0.8, z: 0 };
    // Brow pulled down (y larger = lower)
    lm[107] = { x: 0.4, y: 0.42, z: 0 }; // left brow - same y as eye
    lm[133] = { x: 0.4, y: 0.41, z: 0 }; // left eye inner
    lm[336] = { x: 0.6, y: 0.42, z: 0 };
    lm[362] = { x: 0.6, y: 0.41, z: 0 };
    const scores = computeEmotionScores(lm);
    expect(scores.frustrated).toBeGreaterThan(0);
  });
});
