import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * MediaPipe Face Mesh landmark indices used for expression analysis.
 * From the 478-point model.
 */
const UPPER_LIP = 13;    // inner upper lip
const LOWER_LIP = 14;    // inner lower lip
const FOREHEAD = 10;     // forehead center
const CHIN = 152;        // chin tip
const LEFT_BROW_INNER = 107;  // inner left eyebrow
const RIGHT_BROW_INNER = 336; // inner right eyebrow
const LEFT_EYE_INNER = 133;   // inner left eye corner
const RIGHT_EYE_INNER = 362;  // inner right eye corner

/**
 * Compute expression energy from face landmarks.
 *
 * Uses mouth openness and brow raise as animation cues.
 * Returns [0, 1]: 0 = flat/neutral, 1 = highly animated.
 *
 * @param landmarks - 478 face landmarks from MediaPipe
 */
export function computeExpressionEnergy(landmarks: NormalizedLandmark[]): number {
  if (landmarks.length < 478) return 0;

  const faceHeight = Math.abs(landmarks[CHIN].y - landmarks[FOREHEAD].y);
  if (faceHeight < 1e-6) return 0;

  // Mouth openness: vertical gap between inner lips, normalized by face height
  const mouthGap = Math.abs(landmarks[LOWER_LIP].y - landmarks[UPPER_LIP].y);
  const mouthOpenness = mouthGap / faceHeight;
  // Typical max mouth openness ~ 0.15 of face height
  const mouthScore = Math.min(1, mouthOpenness / 0.15);

  // Brow raise: distance from inner brow to inner eye corner, normalized
  const leftBrowRaise = (landmarks[LEFT_EYE_INNER].y - landmarks[LEFT_BROW_INNER].y) / faceHeight;
  const rightBrowRaise = (landmarks[RIGHT_EYE_INNER].y - landmarks[RIGHT_BROW_INNER].y) / faceHeight;
  const avgBrowRaise = (leftBrowRaise + rightBrowRaise) / 2;
  // Normalize: typical raised-brow distance ~ 0.15 of face height
  const browScore = Math.min(1, Math.max(0, avgBrowRaise / 0.15));

  // Weighted combination: mouth is primary, brow is secondary
  return 0.6 * mouthScore + 0.4 * browScore;
}
