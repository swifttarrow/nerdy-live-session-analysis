import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * MediaPipe Face Landmarker landmark indices (from the 478-point model)
 *
 * Eye corners:
 *   Left eye:  inner=133, outer=33
 *   Right eye: inner=362, outer=263
 * Iris centers:
 *   Left: 468  Right: 473
 * Nose tip: 1
 */
const LEFT_EYE_INNER = 133;
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_INNER = 362;
const RIGHT_EYE_OUTER = 263;
const LEFT_IRIS = 468;
const RIGHT_IRIS = 473;

// Cheek landmarks for head pose estimation
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;
const NOSE_TIP = 1;
const CHIN = 152;
const FOREHEAD = 10;

/**
 * Derive eye_contact_score ∈ [0, 1] from face landmarks.
 *
 * Score = f(iris_centered, head_facing_forward)
 *   - iris_centered: 1 when iris is centered in eye socket
 *   - head_facing_forward: 1 when face is looking straight at camera
 *
 * Returns null if landmarks insufficient.
 */
export function deriveGazeScore(result: FaceLandmarkerResult): number | null {
  const landmarks = result.faceLandmarks?.[0];
  if (!landmarks || landmarks.length < 478) return null;

  const irisScore = computeIrisScore(landmarks);
  const headScore = computeHeadFacingScore(landmarks);

  // Weighted combination: iris position is primary signal
  const combined = 0.6 * irisScore + 0.4 * headScore;
  return Math.max(0, Math.min(1, combined));
}

/**
 * Compute how centered the irises are within the eye sockets.
 * Score 1 = both irises fully centered; 0 = looking hard to the side.
 */
function computeIrisScore(lm: NormalizedLandmark[]): number {
  const leftScore = irisOffsetScore(
    lm[LEFT_IRIS],
    lm[LEFT_EYE_INNER],
    lm[LEFT_EYE_OUTER]
  );
  const rightScore = irisOffsetScore(
    lm[RIGHT_IRIS],
    lm[RIGHT_EYE_INNER],
    lm[RIGHT_EYE_OUTER]
  );
  return (leftScore + rightScore) / 2;
}

function irisOffsetScore(
  iris: NormalizedLandmark,
  inner: NormalizedLandmark,
  outer: NormalizedLandmark
): number {
  const eyeWidth = Math.abs(outer.x - inner.x);
  if (eyeWidth < 1e-6) return 0.5; // degenerate

  const eyeCenterX = (inner.x + outer.x) / 2;
  const eyeCenterY = (inner.y + outer.y) / 2;

  const dx = Math.abs(iris.x - eyeCenterX) / (eyeWidth * 0.5);
  const dy = Math.abs(iris.y - eyeCenterY) / (eyeWidth * 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // score = 1 when perfectly centered, 0 when iris is at edge
  return Math.max(0, 1 - dist);
}

/**
 * Compute how much the face is turned toward/away from the camera.
 * Uses face asymmetry: if left and right halves are equal → facing forward.
 */
function computeHeadFacingScore(lm: NormalizedLandmark[]): number {
  // Yaw: compare horizontal distance from nose to each cheek
  const noseX = lm[NOSE_TIP].x;
  const leftCheekX = lm[LEFT_CHEEK].x;
  const rightCheekX = lm[RIGHT_CHEEK].x;

  const leftDist = Math.abs(noseX - leftCheekX);
  const rightDist = Math.abs(noseX - rightCheekX);
  const total = leftDist + rightDist;

  // Yaw score: 1 when symmetric, decreases as asymmetry grows
  const yawScore = total > 1e-6 ? 1 - Math.abs(leftDist - rightDist) / total : 1;

  // Pitch: compare nose y to midpoint of forehead–chin
  const noseY = lm[NOSE_TIP].y;
  const foreheadY = lm[FOREHEAD].y;
  const chinY = lm[CHIN].y;
  const midY = (foreheadY + chinY) / 2;
  const faceHeight = Math.abs(chinY - foreheadY);
  const pitchOffset = faceHeight > 1e-6 ? Math.abs(noseY - midY) / faceHeight : 0;
  const pitchScore = Math.max(0, 1 - pitchOffset * 2);

  return (yawScore * 0.7 + pitchScore * 0.3);
}
