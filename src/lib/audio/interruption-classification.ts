/**
 * Tier 1 interruption classification using direction-based heuristics.
 * No transcription required.
 *
 * Rules (per post-MVP plan):
 * - student_to_tutor → productive (student engagement signal)
 * - tutor_to_student, count > threshold → unproductive
 * - tutor_to_student, count ≤ threshold → neutral
 */

import type { InterruptionStats } from "./interruptions";

export interface InterruptionClassification {
  productive: number;
  unproductive: number;
  neutral: number;
}

export interface ClassificationConfig {
  /** tutor→student count above which those interruptions are unproductive */
  unproductiveThreshold: number;
}

export const DEFAULT_CLASSIFICATION_CONFIG: ClassificationConfig = {
  unproductiveThreshold: 5,
};

/**
 * Classify session interruptions into productive / unproductive / neutral.
 */
export function classifyInterruptions(
  stats: InterruptionStats,
  config: ClassificationConfig = DEFAULT_CLASSIFICATION_CONFIG
): InterruptionClassification {
  const productive = stats.studentToTutor;

  let unproductive = 0;
  let neutral = 0;

  if (stats.tutorToStudent > config.unproductiveThreshold) {
    unproductive = stats.tutorToStudent;
  } else {
    neutral = stats.tutorToStudent;
  }

  return { productive, unproductive, neutral };
}
