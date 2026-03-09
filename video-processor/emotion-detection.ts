import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * Student emotional states inferred from facial landmarks.
 * 15 states spanning positive (session going well) to negative (struggling).
 */
export type EmotionalState =
  | "engaged"
  | "attentive"
  | "curious"
  | "confident"
  | "understanding"
  | "excited"
  | "focused"
  | "neutral"
  | "thinking"
  | "confused"
  | "frustrated"
  | "tired"
  | "defeated"
  | "bored"
  | "anxious";

/** Session-positive states (engagement signals) */
export const POSITIVE_STATES: EmotionalState[] = [
  "engaged",
  "attentive",
  "curious",
  "confident",
  "understanding",
  "excited",
  "focused",
];

/** Session-negative states (struggling signals) */
export const NEGATIVE_STATES: EmotionalState[] = [
  "confused",
  "frustrated",
  "tired",
  "defeated",
  "bored",
  "anxious",
];

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
const LEFT_BROW_OUTER = 46;
const RIGHT_BROW_OUTER = 276;

export interface EmotionScores {
  engaged: number;
  attentive: number;
  curious: number;
  confident: number;
  understanding: number;
  excited: number;
  focused: number;
  neutral: number;
  thinking: number;
  confused: number;
  frustrated: number;
  tired: number;
  defeated: number;
  bored: number;
  anxious: number;
}

const EMOTION_THRESHOLD = 0.45;

export const ZERO_EMOTION_SCORES: EmotionScores = {
  engaged: 0,
  attentive: 0,
  curious: 0,
  confident: 0,
  understanding: 0,
  excited: 0,
  focused: 0,
  neutral: 0,
  thinking: 0,
  confused: 0,
  frustrated: 0,
  tired: 0,
  defeated: 0,
  bored: 0,
  anxious: 0,
};

/**
 * Infer emotional state from face landmarks.
 * Returns the dominant emotion if any score exceeds threshold, else "neutral".
 */
export function detectEmotion(result: FaceLandmarkerResult): EmotionalState {
  const landmarks = result.faceLandmarks?.[0];
  if (!landmarks || landmarks.length < 478) return "neutral";

  const scores = computeEmotionScores(landmarks);

  const candidates = (
    [
      "engaged",
      "attentive",
      "curious",
      "confident",
      "understanding",
      "excited",
      "focused",
      "thinking",
      "confused",
      "frustrated",
      "tired",
      "defeated",
      "bored",
      "anxious",
    ] as const
  ).filter((k) => scores[k] >= EMOTION_THRESHOLD);

  if (candidates.length === 0) return "neutral";

  let best: EmotionalState = candidates[0];
  let bestScore = scores[best];
  for (const k of candidates) {
    if (scores[k] > bestScore) {
      best = k;
      bestScore = scores[k];
    }
  }
  return best;
}

/**
 * Compute raw emotion scores [0, 1] for each emotion type.
 */
export function computeEmotionScores(landmarks: NormalizedLandmark[]): EmotionScores {
  const faceHeight = Math.abs(landmarks[CHIN].y - landmarks[FOREHEAD].y);
  if (faceHeight < 1e-6) return { ...ZERO_EMOTION_SCORES, neutral: 1 };

  const scores: EmotionScores = { ...ZERO_EMOTION_SCORES };

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

  const leftBrowGap = landmarks[LEFT_EYE_INNER].y - landmarks[LEFT_BROW_INNER].y;
  const rightBrowGap =
    landmarks[RIGHT_EYE_INNER].y - landmarks[RIGHT_BROW_INNER].y;
  const browGap = (leftBrowGap + rightBrowGap) / 2 / faceHeight;

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

  // --- Positive states ---
  scores.engaged = Math.min(
    1,
    0.4 * eyeOpenness + 0.4 * smile + 0.2 * Math.max(0, 1 - furrowed)
  );
  scores.attentive = Math.min(1, 0.6 * eyeOpenness + 0.4 * (1 - headDown));
  scores.curious = Math.min(1, 0.5 * raised + 0.5 * eyeOpenness);
  scores.confident = Math.min(1, 0.6 * smile + 0.4 * (1 - furrowed));
  scores.understanding = Math.min(
    1,
    0.5 * smile + 0.3 * (1 - furrowed) + 0.2 * eyeOpenness
  );
  scores.excited = Math.min(1, 0.6 * smile + 0.4 * eyeOpenness);
  scores.focused = Math.min(
    1,
    0.5 * Math.min(1, furrowed * 0.8) + 0.5 * eyeOpenness
  );

  // --- Neutral / thinking ---
  scores.neutral = Math.min(
    1,
    1 -
      Math.max(
        scores.engaged,
        scores.frustrated,
        scores.tired,
        scores.defeated,
        scores.bored
      )
  );
  scores.thinking = Math.min(1, 0.6 * furrowed + 0.4 * (1 - smile));

  // --- Negative states ---
  scores.confused = Math.min(1, 0.6 * furrowed + 0.4 * raised);
  scores.frustrated = Math.min(1, 0.7 * furrowed + 0.3 * cornersDown);
  scores.tired = Math.min(
    1,
    0.6 * (1 - eyeOpenness) + 0.4 * Math.max(0, 1 - browGap / 0.08)
  );
  scores.defeated = Math.min(
    1,
    0.6 * (mouthClosed * 0.5 + frown * 0.5) + 0.4 * Math.min(1, headDown * 5)
  );
  scores.bored = Math.min(
    1,
    0.7 * (1 - eyeOpenness) + 0.3 * (1 - Math.abs(smile - 0.5) * 2)
  );
  scores.anxious = Math.min(1, 0.5 * furrowed + 0.5 * cornersDown);

  return scores;
}
