import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * Student emotional states inferred from facial landmarks.
 * Consolidated to 3 states: positive (engagement), neutral, negative (struggling).
 */
export type EmotionalState = "positive" | "neutral" | "negative";

/** Raw scores [0, 1] for the 3 emotional states (for debug) */
export interface EmotionScores {
  positive: number;
  neutral: number;
  negative: number;
}

export const ZERO_EMOTION_SCORES: EmotionScores = {
  positive: 0,
  neutral: 0,
  negative: 0,
};

/** Threshold for emotion detection. Lowered for better negative-emotion sensitivity. */
const EMOTION_THRESHOLD = 0.35;

/** When positive and negative are close, favor negative (student may be struggling). */
const NEGATIVE_FAVOR_MARGIN = 0.05;

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

/**
 * Infer emotional state from face landmarks.
 * Returns one of: positive, neutral, negative.
 * - Lower threshold (0.35) for better sensitivity to negative expressions.
 * - Favors negative when ambiguous (close scores) to surface struggling students.
 */
export function detectEmotion(result: FaceLandmarkerResult): EmotionalState {
  const landmarks = result.faceLandmarks?.[0];
  if (!landmarks || landmarks.length < 478) return "neutral";

  const scores = computeEmotionScores(landmarks);

  const { positive, negative } = scores;

  // Favor negative when ambiguous: if negative is above threshold and
  // (negative >= positive, or positive is below threshold, or scores are close)
  if (
    negative >= EMOTION_THRESHOLD &&
    (negative >= positive || positive < EMOTION_THRESHOLD || negative >= positive - NEGATIVE_FAVOR_MARGIN)
  ) {
    return "negative";
  }

  if (positive >= EMOTION_THRESHOLD) {
    return "positive";
  }

  return "neutral";
}

/**
 * Compute raw emotion scores [0, 1] for positive, neutral, and negative.
 * Aggregates from granular face features (eyes, mouth, brows).
 */
export function computeEmotionScores(landmarks: NormalizedLandmark[]): EmotionScores {
  const faceHeight = Math.abs(landmarks[CHIN].y - landmarks[FOREHEAD].y);
  if (faceHeight < 1e-6) return { ...ZERO_EMOTION_SCORES, neutral: 1 };

  // --- Derived features ---
  const leftEyeOpen = Math.abs(
    (landmarks[LEFT_EYE_TOP]?.y ?? 0) - (landmarks[LEFT_EYE_BOTTOM]?.y ?? 0)
  );
  const rightEyeOpen = Math.abs(
    (landmarks[RIGHT_EYE_TOP]?.y ?? 0) - (landmarks[RIGHT_EYE_BOTTOM]?.y ?? 0)
  );
  const avgEyeOpen = (leftEyeOpen + rightEyeOpen) / 2;
  const eyeOpenness = Math.min(1, avgEyeOpen / (faceHeight * 0.08));

  const mouthLeftY = landmarks[MOUTH_LEFT]?.y ?? landmarks[UPPER_LIP].y;
  const mouthRightY = landmarks[MOUTH_RIGHT]?.y ?? landmarks[UPPER_LIP].y;
  const mouthMidY = (landmarks[UPPER_LIP].y + landmarks[LOWER_LIP].y) / 2;
  const mouthGap = Math.abs(landmarks[LOWER_LIP].y - landmarks[UPPER_LIP].y);

  const smile = mouthMidY > (mouthLeftY + mouthRightY) / 2 ? 1 : 0;
  const frown = (mouthLeftY + mouthRightY) / 2 > mouthMidY ? 1 : 0;

  const browDown =
    Math.max(
      0,
      (landmarks[LEFT_BROW_INNER].y - landmarks[LEFT_EYE_INNER].y) / faceHeight
    ) +
    Math.max(
      0,
      (landmarks[RIGHT_BROW_INNER].y - landmarks[RIGHT_EYE_INNER].y) / faceHeight
    ) / 2;
  const furrowed = Math.min(1, browDown / 0.06);

  const browRaised =
    (landmarks[LEFT_EYE_INNER].y - landmarks[LEFT_BROW_INNER].y) / faceHeight +
    (landmarks[RIGHT_EYE_INNER].y - landmarks[RIGHT_BROW_INNER].y) / faceHeight;
  const raised = Math.min(1, Math.max(0, (browRaised - 0.06) / 0.04));

  const noseY = landmarks[NOSE_TIP].y;
  const foreheadY = landmarks[FOREHEAD].y;
  const chinY = landmarks[CHIN].y;
  const headTilt = (noseY - (foreheadY + chinY) / 2) / faceHeight;
  const headDown = Math.max(0, headTilt);

  const mouthClosed = mouthGap < faceHeight * 0.02 ? 1 : 0;
  const cornersDown =
    ((mouthLeftY > mouthMidY ? 1 : 0) + (mouthRightY > mouthMidY ? 1 : 0)) / 2;

  // --- Aggregate to 3 states ---
  const positiveSignals = [
    0.4 * eyeOpenness + 0.4 * smile + 0.2 * Math.max(0, 1 - furrowed),
    0.6 * eyeOpenness + 0.4 * (1 - headDown),
    0.5 * raised + 0.5 * eyeOpenness,
    0.6 * smile + 0.4 * (1 - furrowed),
    0.5 * smile + 0.3 * (1 - furrowed) + 0.2 * eyeOpenness,
    0.6 * smile + 0.4 * eyeOpenness,
  ];
  const positive = Math.min(1, Math.max(...positiveSignals));

  const negativeSignals = [
    0.6 * furrowed + 0.4 * raised,
    0.7 * furrowed + 0.3 * cornersDown,
    0.6 * (1 - eyeOpenness) + 0.4 * 0.5,
    0.6 * (mouthClosed * 0.5 + frown * 0.5) + 0.4 * Math.min(1, headDown * 5),
    0.7 * (1 - eyeOpenness) + 0.3 * 0.5,
    0.5 * furrowed + 0.5 * cornersDown,
    // Head down (e.g. head in hands) is often a disengagement/struggle signal
    0.5 * Math.min(1, headDown * 4) + 0.5 * (1 - eyeOpenness),
  ];
  const negative = Math.min(1, Math.max(...negativeSignals));

  const neutral = Math.min(1, 1 - Math.max(positive, negative));

  return { positive, neutral, negative };
}
