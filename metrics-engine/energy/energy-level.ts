/**
 * Combined energy level score from voice and facial expression inputs.
 * Per post-MVP plan: voice tone + facial expression → energy level.
 */

export interface EnergyInputs {
  /** Voice RMS energy [0, 1]; null if audio unavailable */
  voiceEnergy: number | null;
  /** Facial expression energy [0, 1]; null if face undetected */
  expressionEnergy: number | null;
}

export interface EnergyWeights {
  voice: number;
  expression: number;
}

const DEFAULT_WEIGHTS: EnergyWeights = {
  voice: 0.6,
  expression: 0.4,
};

/**
 * Combine voice and expression energy into a unified [0, 1] score.
 * Gracefully handles missing inputs (null) by falling back to the
 * available signal, or returning 0 if both are null.
 */
export function combineEnergyScores(
  inputs: EnergyInputs,
  weights: EnergyWeights = DEFAULT_WEIGHTS
): number {
  const { voiceEnergy, expressionEnergy } = inputs;

  if (voiceEnergy === null && expressionEnergy === null) return 0;
  if (voiceEnergy === null) return Math.max(0, Math.min(1, expressionEnergy!));
  if (expressionEnergy === null) return Math.max(0, Math.min(1, voiceEnergy));

  const totalWeight = weights.voice + weights.expression;
  const combined =
    (weights.voice * voiceEnergy + weights.expression * expressionEnergy) / totalWeight;
  return Math.max(0, Math.min(1, combined));
}

export type EnergyLevelCategory = "low" | "medium" | "high";

/** Classify a [0, 1] energy score into a named category. */
export function classifyEnergyLevel(score: number): EnergyLevelCategory {
  if (score < 0.33) return "low";
  if (score < 0.67) return "medium";
  return "high";
}
