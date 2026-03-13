import type { SessionPreset } from "@coaching-system/presets";
import { TALK_BALANCE_CENTER } from "./talk-balance";

export type ParticipationLabel = "great" | "good" | "needs_improvement";

/** Ideal center (μ) per preset; σ = 0.2. Great: |z| ≤ 0.5, Good: |z| ≤ 1, Needs improvement: |z| > 1 */
const SIGMA = 0.2;
const DEFAULT_CENTER = 0.5;

/**
 * Classify student talk ratio into participation label using a normal distribution
 * centered on the preset's ideal. For Socratic, ideal ≈70%.
 */
export function classifyParticipation(
  studentTalkRatio: number,
  preset?: SessionPreset
): ParticipationLabel {
  const center = preset ? TALK_BALANCE_CENTER[preset] : DEFAULT_CENTER;
  const z = Math.abs((studentTalkRatio - center) / SIGMA);

  if (z <= 0.5) return "great";
  if (z <= 1) return "good";
  return "needs_improvement";
}

export function participationDescription(label: ParticipationLabel): string {
  switch (label) {
    case "great":
      return "Student talk time was close to the ideal for this session type — strong participation balance.";
    case "good":
      return "Student participation was within a good range for this session type — room to fine-tune.";
    case "needs_improvement":
      return "Student talk time was outside the ideal range for this session type — consider adjusting the balance.";
  }
}
