/**
 * M29: Tier 2 interruption classification via keyword/heuristic content analysis.
 * Classifies overlap content as clarifying, procedural, or off-topic.
 *
 * Full Whisper-based transcription is not implemented here (requires API key + audio capture).
 * This module provides the classification logic that operates on transcript text when available.
 */

export type ContentCategory = "clarifying" | "procedural" | "off_topic";
export type InterruptionProductivity = "productive" | "neutral" | "unproductive";

export interface Tier2Classification {
  contentCategory: ContentCategory;
  productivity: InterruptionProductivity;
  confidence: "high" | "low";
}

const CLARIFYING_KEYWORDS = [
  "why", "what", "how", "when", "where", "which", "explain", "mean",
  "understand", "confused", "clarify", "tell me", "what do you",
];

const PROCEDURAL_KEYWORDS = [
  "wait", "hold on", "one sec", "sorry", "actually", "let me",
  "i think", "maybe", "can i", "could you", "would you",
];

const OFF_TOPIC_SIGNALS = [
  "by the way", "anyway", "random", "oh yeah", "never mind",
];

/**
 * Classify a transcript snippet from an overlap window.
 * Direction indicates who interrupted whom: "tutor_to_student" or "student_to_tutor".
 */
export function classifyOverlapContent(
  transcript: string,
  direction: "tutor_to_student" | "student_to_tutor"
): Tier2Classification {
  const lower = transcript.toLowerCase();

  const hasClarifying = CLARIFYING_KEYWORDS.some((kw) => lower.includes(kw));
  const hasProcedural = PROCEDURAL_KEYWORDS.some((kw) => lower.includes(kw));
  const hasOffTopic = OFF_TOPIC_SIGNALS.some((kw) => lower.includes(kw));

  let contentCategory: ContentCategory;
  if (hasOffTopic) {
    contentCategory = "off_topic";
  } else if (hasClarifying) {
    contentCategory = "clarifying";
  } else if (hasProcedural) {
    contentCategory = "procedural";
  } else {
    // Default by direction if no keyword match
    contentCategory = direction === "student_to_tutor" ? "clarifying" : "procedural";
  }

  let productivity: InterruptionProductivity;
  if (contentCategory === "clarifying" && direction === "student_to_tutor") {
    productivity = "productive"; // student asking a question
  } else if (contentCategory === "off_topic") {
    productivity = "unproductive";
  } else {
    productivity = "neutral";
  }

  const confidence: "high" | "low" = hasClarifying || hasOffTopic || hasProcedural ? "high" : "low";

  return { contentCategory, productivity, confidence };
}

/**
 * Summarize Tier 2 classifications into counts.
 */
export function summarizeTier2Classifications(
  classifications: Tier2Classification[]
): { clarifying: number; procedural: number; off_topic: number } {
  return {
    clarifying: classifications.filter((c) => c.contentCategory === "clarifying").length,
    procedural: classifications.filter((c) => c.contentCategory === "procedural").length,
    off_topic: classifications.filter((c) => c.contentCategory === "off_topic").length,
  };
}
