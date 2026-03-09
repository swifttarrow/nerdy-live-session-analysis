export type ParticipationLabel = "passive" | "moderate" | "engaged";

export interface ParticipationThresholds {
  passiveBelow: number;   // default 0.20
  engagedAbove: number;   // default 0.40
}

const DEFAULT_THRESHOLDS: ParticipationThresholds = {
  passiveBelow: 0.20,
  engagedAbove: 0.40,
};

/**
 * Classify student talk ratio into participation label.
 */
export function classifyParticipation(
  studentTalkRatio: number,
  thresholds: ParticipationThresholds = DEFAULT_THRESHOLDS
): ParticipationLabel {
  if (studentTalkRatio < thresholds.passiveBelow) return "passive";
  if (studentTalkRatio >= thresholds.engagedAbove) return "engaged";
  return "moderate";
}

export function participationDescription(label: ParticipationLabel): string {
  switch (label) {
    case "passive":
      return "Student was mostly passive — little opportunity for knowledge retrieval or self-explanation.";
    case "moderate":
      return "Student had moderate participation — some back-and-forth but room to improve.";
    case "engaged":
      return "Student was actively engaged — good balance of tutor instruction and student expression.";
  }
}
