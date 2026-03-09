import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * Student emotional states inferred from facial landmarks.
 * Heuristic-based detection using MediaPipe 478-point face model.
 */
export type EmotionalState =
  | "neutral"
  | "tired"
  | "frustrated"
  | "defeated";

/**
 * MediaPipe Face Mesh landmark indices (478-point model).
 */
const UPPER_LIP = 13;
const LOWER_LIP = 14;
const FOREHEAD = 10;
const CHIN = 152;
const LEFT_BROW_INNER = 107;
const RIGHT_BROW_INNER = 336;
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_INNER = 362;
const LEFT_EYE_TOP = 159;
const LEFT_EYE_BOTTOM = 145;
const RIGHT_EYE_TOP = 386;
const RIGHT_EYE_BOTTOM = 374;
const MOUTH_LEFT = 61;
const MOUTH_RIGHT = 291;
const NOSE_TIP = 1;

export interface EmotionScores {
  tired: number;      // [0, 1] - droopy eyes, relaxed brow
  frustrated: number; // [0, 1] - furrowed brow, tense mouth
  defeated: number;  // [0, 1] - frown, downward gaze, low energy
}

const EMOTION_THRESHOLD = 0.5;

/**
 * Infer emotional state from face landmarks.
 * Returns the dominant emotion if any score exceeds threshold, else "neutral".
 *
 * Heuristics:
 * - Tired: low eye openness (droopy), brow relaxed
 * - Frustrated: brow furrowed (brow inner down), mouth corners tense
 * - Defeated: mouth frown, downward head tilt, low expression energy
 */
export function detectEmotion(result: FaceLandmarkerResult): EmotionalState {
  const landmarks = result.faceLandmarks?.[0];
  if (!landmarks || landmarks.length < 478) return "neutral";

  const scores = computeEmotionScores(landmarks);
  const max = Math.max(scores.tired, scores.frustrated, scores.defeated);
  if (max < EMOTION_THRESHOLD) return "neutral";

  if (scores.tired >= scores.frustrated && scores.tired >= scores.defeated) return "tired";
  if (scores.frustrated >= scores.tired && scores.frustrated >= scores.defeated) return "frustrated";
  return "defeated";
}

/**
 * Compute raw emotion scores [0, 1] for each emotion type.
 * Useful for smoothing and threshold-based triggers.
 */
export function computeEmotionScores(landmarks: NormalizedLandmark[]): EmotionScores {
  const faceHeight = Math.abs(landmarks[CHIN].y - landmarks[FOREHEAD].y);
  if (faceHeight < 1e-6) return { tired: 0, frustrated: 0, defeated: 0 };

  // --- Tired: eye openness (droopy = low) + brow relaxed ---
  const leftEyeOpen = Math.abs((landmarks[LEFT_EYE_TOP]?.y ?? 0) - (landmarks[LEFT_EYE_BOTTOM]?.y ?? 0));
  const rightEyeOpen = Math.abs((landmarks[RIGHT_EYE_TOP]?.y ?? 0) - (landmarks[RIGHT_EYE_BOTTOM]?.y ?? 0));
  const avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2;
  const eyeOpenness = Math.min(1, avgEyeOpen / (faceHeight * 0.08)); // typical ~8% of face
  const tiredFromEyes = 1 - eyeOpenness; // low openness = high tired

  const leftBrowGap = landmarks[LEFT_EYE_INNER].y - landmarks[LEFT_BROW_INNER].y;
  const rightBrowGap = landmarks[RIGHT_EYE_INNER].y - landmarks[RIGHT_BROW_INNER].y;
  const browGap = (leftBrowGap + rightBrowGap) / 2 / faceHeight;
  const tiredFromBrow = Math.max(0, 1 - browGap / 0.08); // relaxed brow = small gap

  const tired = Math.min(1, 0.6 * tiredFromEyes + 0.4 * tiredFromBrow);

  // --- Frustrated: brow furrowed (brow down) + mouth tense ---
  const browDown = Math.max(0, (landmarks[LEFT_BROW_INNER].y - landmarks[LEFT_EYE_INNER].y) / faceHeight);
  const browDownR = Math.max(0, (landmarks[RIGHT_BROW_INNER].y - landmarks[RIGHT_EYE_INNER].y) / faceHeight);
  const furrowed = Math.min(1, ((browDown + browDownR) / 2) / 0.06);

  const mouthLeftY = landmarks[MOUTH_LEFT]?.y ?? landmarks[UPPER_LIP].y;
  const mouthRightY = landmarks[MOUTH_RIGHT]?.y ?? landmarks[UPPER_LIP].y;
  const mouthMidY = (landmarks[UPPER_LIP].y + landmarks[LOWER_LIP].y) / 2;
  const cornersDown = ((mouthLeftY > mouthMidY ? 1 : 0) + (mouthRightY > mouthMidY ? 1 : 0)) / 2;
  const frustrated = Math.min(1, 0.7 * furrowed + 0.3 * cornersDown);

  // --- Defeated: frown + downward gaze ---
  const mouthGap = Math.abs(landmarks[LOWER_LIP].y - landmarks[UPPER_LIP].y);
  const mouthClosed = mouthGap < faceHeight * 0.02 ? 1 : 0;
  const frown = (mouthLeftY + mouthRightY) / 2 > mouthMidY ? 1 : 0;
  const defeatedFromMouth = mouthClosed * 0.5 + frown * 0.5;

  const noseY = landmarks[NOSE_TIP].y;
  const foreheadY = landmarks[FOREHEAD].y;
  const chinY = landmarks[CHIN].y;
  const headTilt = (noseY - (foreheadY + chinY) / 2) / faceHeight;
  const headDown = Math.max(0, headTilt); // positive = nose down

  const defeated = Math.min(1, 0.6 * defeatedFromMouth + 0.4 * Math.min(1, headDown * 5));

  return { tired, frustrated, defeated };
}
