/**
 * Tier 1 interruption classification using direction-based heuristics.
 * No transcription required.
 *
 * Rules (per post-MVP plan):
 * - student_to_tutor → productive (student engagement signal)
 * - tutor_to_student, count > threshold → unproductive
 * - tutor_to_student, count ≤ threshold → neutral
 *
 * M29: Tier 2 content-based classification when overlap transcripts are available.
 */

import type { InterruptionStats } from "./interruptions";
import { classifyOverlapContent } from "./interruption-transcription";

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

/**
 * M29: Classify interruptions with optional Tier 2 content-based analysis.
 * When overlapTranscripts is provided (aligned with stats.events), uses
 * classifyOverlapContent for each overlap. Otherwise falls back to Tier 1.
 */
export function classifyInterruptionsWithContent(
  stats: InterruptionStats,
  overlapTranscripts?: string[],
  config: ClassificationConfig = DEFAULT_CLASSIFICATION_CONFIG
): InterruptionClassification {
  const useTier2 =
    overlapTranscripts &&
    overlapTranscripts.length === stats.events.length;

  if (!useTier2) {
    return classifyInterruptions(stats, config);
  }

  let productive = 0;
  let neutral = 0;
  let unproductive = 0;

  for (let i = 0; i < stats.events.length; i++) {
    const event = stats.events[i];
    const transcript = overlapTranscripts[i] ?? "";
    const tier2 = classifyOverlapContent(transcript, event.direction);
    switch (tier2.productivity) {
      case "productive":
        productive++;
        break;
      case "unproductive":
        unproductive++;
        break;
      default:
        neutral++;
    }
  }

  return { productive, neutral, unproductive };
}
