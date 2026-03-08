import type { SessionSummary } from "./summary";

export interface Recommendation {
  category: "talk_balance" | "eye_contact" | "engagement" | "general";
  text: string;
  priority: "high" | "medium" | "low";
}

/**
 * Generate template-based recommendations from session summary.
 * Always returns ≥1 recommendation per ONE_PAGER requirements.
 */
export function generateRecommendations(summary: SessionSummary): Recommendation[] {
  const recs: Recommendation[] = [];

  // Talk balance recommendations
  if (summary.studentTalkRatio < 0.2) {
    recs.push({
      category: "talk_balance",
      text: `The student spoke only ${Math.round(summary.studentTalkRatio * 100)}% of the time. Consider asking more open-ended questions to increase student engagement. Try: "What do you think about…?" or "Can you explain that in your own words?"`,
      priority: "high",
    });
  } else if (summary.studentTalkRatio < 0.35) {
    recs.push({
      category: "talk_balance",
      text: `The student spoke ${Math.round(summary.studentTalkRatio * 100)}% of the time (target: ≥35%). Try pausing more frequently to invite student responses.`,
      priority: "medium",
    });
  } else if (summary.avgTutorTalkPercent > 0.85) {
    recs.push({
      category: "talk_balance",
      text: `You spoke ${Math.round(summary.avgTutorTalkPercent * 100)}% of the session. Even when the student is engaged, leaving deliberate pauses can encourage deeper thinking.`,
      priority: "medium",
    });
  } else {
    recs.push({
      category: "talk_balance",
      text: `Good talk balance! The student spoke ${Math.round(summary.studentTalkRatio * 100)}% of the time, which is a healthy engagement level.`,
      priority: "low",
    });
  }

  // Eye contact recommendations
  if (summary.avgStudentEyeContact < 0.4) {
    recs.push({
      category: "eye_contact",
      text: `The student's eye contact score averaged ${(summary.avgStudentEyeContact * 100).toFixed(0)}%. The student may have been frequently distracted. Try varying your delivery style or incorporating more interactive exercises.`,
      priority: "high",
    });
  } else if (summary.avgTutorEyeContact < 0.4) {
    recs.push({
      category: "eye_contact",
      text: `Your eye contact score averaged ${(summary.avgTutorEyeContact * 100).toFixed(0)}%. Looking more directly at the camera helps students feel connected during online sessions.`,
      priority: "medium",
    });
  }

  // Overall engagement
  if (summary.engagementScore < 0.35) {
    recs.push({
      category: "engagement",
      text: `The overall engagement score was ${(summary.engagementScore * 100).toFixed(0)}%. Consider shorter explanations followed by immediate practice problems to keep the student active.`,
      priority: "high",
    });
  } else if (summary.engagementScore > 0.7) {
    recs.push({
      category: "engagement",
      text: `Excellent session engagement (${(summary.engagementScore * 100).toFixed(0)}%)! Maintain this interactive style in future sessions.`,
      priority: "low",
    });
  }

  // Fallback: always have at least one recommendation
  if (recs.length === 0) {
    recs.push({
      category: "general",
      text: "Keep encouraging the student to verbalize their thinking — it helps identify misunderstandings early.",
      priority: "low",
    });
  }

  return recs;
}
