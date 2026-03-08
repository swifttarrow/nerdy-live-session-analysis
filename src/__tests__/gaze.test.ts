import { describe, it, expect } from "vitest";
import { deriveGazeScore } from "@/lib/video/gaze";
import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

/** Build a 478-landmark array with a default value, then override specific indices */
function makeLandmarks(overrides: Record<number, Partial<NormalizedLandmark>> = {}): NormalizedLandmark[] {
  const lm: NormalizedLandmark[] = Array.from({ length: 478 }, (_, i) => ({
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

function makeResult(landmarks: NormalizedLandmark[]): FaceLandmarkerResult {
  return {
    faceLandmarks: [landmarks],
    faceBlendshapes: [],
    facialTransformationMatrixes: [],
  } as unknown as FaceLandmarkerResult;
}

describe("deriveGazeScore", () => {
  it("returns null when no landmarks", () => {
    const result = { faceLandmarks: [], faceBlendshapes: [], facialTransformationMatrixes: [] } as unknown as FaceLandmarkerResult;
    expect(deriveGazeScore(result)).toBeNull();
  });

  it("returns null when insufficient landmarks (< 478)", () => {
    const result = {
      faceLandmarks: [Array.from({ length: 10 }, () => ({ x: 0.5, y: 0.5, z: 0 }))],
      faceBlendshapes: [],
      facialTransformationMatrixes: [],
    } as unknown as FaceLandmarkerResult;
    expect(deriveGazeScore(result)).toBeNull();
  });

  it("returns score in range [0, 1] for typical centered face", () => {
    // Simulate a face looking at camera: symmetric, irises centered
    const lm = makeLandmarks({
      // Left eye: inner=133, outer=33
      133: { x: 0.55, y: 0.5 },
      33:  { x: 0.45, y: 0.5 },
      // Left iris center: 468 (perfectly centered)
      468: { x: 0.5, y: 0.5 },
      // Right eye: inner=362, outer=263
      362: { x: 0.65, y: 0.5 },
      263: { x: 0.75, y: 0.5 },
      // Right iris center: 473
      473: { x: 0.7, y: 0.5 },
      // Nose tip: 1 (centered)
      1: { x: 0.5, y: 0.5 },
      // Cheeks
      234: { x: 0.3, y: 0.5 },
      454: { x: 0.7, y: 0.5 },
      // Forehead/chin
      10:  { x: 0.5, y: 0.2 },
      152: { x: 0.5, y: 0.8 },
    });
    const score = deriveGazeScore(makeResult(lm));
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThanOrEqual(0);
    expect(score!).toBeLessThanOrEqual(1);
  });

  it("returns lower score when iris is off-center (looking away)", () => {
    // Iris shifted far to the right → looking away
    const centered = makeLandmarks({
      133: { x: 0.45, y: 0.5 }, 33: { x: 0.35, y: 0.5 },
      468: { x: 0.4, y: 0.5 },
      362: { x: 0.55, y: 0.5 }, 263: { x: 0.65, y: 0.5 },
      473: { x: 0.6, y: 0.5 },
      1: { x: 0.5, y: 0.5 }, 234: { x: 0.3, y: 0.5 }, 454: { x: 0.7, y: 0.5 },
      10: { x: 0.5, y: 0.2 }, 152: { x: 0.5, y: 0.8 },
    });

    const lookingAway = makeLandmarks({
      133: { x: 0.45, y: 0.5 }, 33: { x: 0.35, y: 0.5 },
      // Iris at extreme right edge
      468: { x: 0.35, y: 0.5 },
      362: { x: 0.55, y: 0.5 }, 263: { x: 0.65, y: 0.5 },
      473: { x: 0.65, y: 0.5 },
      1: { x: 0.5, y: 0.5 }, 234: { x: 0.3, y: 0.5 }, 454: { x: 0.7, y: 0.5 },
      10: { x: 0.5, y: 0.2 }, 152: { x: 0.5, y: 0.8 },
    });

    const centeredScore = deriveGazeScore(makeResult(centered))!;
    const awayScore = deriveGazeScore(makeResult(lookingAway))!;

    expect(centeredScore).toBeGreaterThan(awayScore);
  });
});
