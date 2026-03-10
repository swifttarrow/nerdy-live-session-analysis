import type { SessionPreset } from "@coaching-system/presets";

/**
 * Ideal student talk ratio (μ) per preset. At the mean, score = 1; penalty grows with deviation.
 */
export const TALK_BALANCE_CENTER: Record<SessionPreset, number> = {
  lecture: 0.3,   // 30% — tutor explains, student listens
  practice: 0.5,   // 50% — balanced problem-solving
  socratic: 0.7,   // 70% — student-led discussion
};

/** Standard deviation (σ) for the Gaussian. Controls how much deviation is tolerated. */
const SIGMA = 0.2;

const DEFAULT_CENTER = 0.5; // fallback when preset unknown (e.g. tests)

/**
 * Compute talk-balance score using a Gaussian (normal distribution) curve.
 * score = exp(-(studentTalkRatio - center)² / (2σ²))
 *
 * At the ideal ratio: score = 1 (no penalty). Penalty increases with deviation from the mean.
 */
export function computeTalkBalanceScore(
  studentTalkRatio: number,
  preset?: SessionPreset
): number {
  const center = preset ? TALK_BALANCE_CENTER[preset] : DEFAULT_CENTER;
  const deviationSq = Math.pow(studentTalkRatio - center, 2);
  return Math.exp(-deviationSq / (2 * SIGMA * SIGMA));
}
