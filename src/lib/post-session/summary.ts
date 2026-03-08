import type { SessionMetrics } from "@/lib/session/metrics-schema";
import type { InterruptionStats } from "@/lib/audio/interruptions";
import type { InterruptionClassification } from "@/lib/audio/interruption-classification";

export interface SessionSummary {
  sessionId: string;
  durationSec: number;
  avgTutorEyeContact: number;
  avgStudentEyeContact: number;
  avgTutorTalkPercent: number;
  avgStudentTalkPercent: number;
  studentTalkRatio: number; // primary engagement-quality signal (ONE_PAGER)
  engagementScore: number; // composite 0–1
  sampleCount: number;
  interruptions?: InterruptionStats & { classification: InterruptionClassification };
}

/**
 * Aggregate session metrics history into a summary.
 */
export function aggregateSessionSummary(
  sessionId: string,
  metricsHistory: SessionMetrics[],
  interruptionData?: (InterruptionStats & { classification: InterruptionClassification }) | null
): SessionSummary {
  const n = metricsHistory.length;

  if (n === 0) {
    return {
      sessionId,
      durationSec: 0,
      avgTutorEyeContact: 0,
      avgStudentEyeContact: 0,
      avgTutorTalkPercent: 0,
      avgStudentTalkPercent: 0,
      studentTalkRatio: 0,
      engagementScore: 0,
      sampleCount: 0,
    };
  }

  const sum = metricsHistory.reduce(
    (acc, m) => ({
      tutorEyeContact: acc.tutorEyeContact + m.metrics.tutor.eye_contact_score,
      studentEyeContact: acc.studentEyeContact + m.metrics.student.eye_contact_score,
      tutorTalk: acc.tutorTalk + m.metrics.tutor.talk_time_percent,
      studentTalk: acc.studentTalk + m.metrics.student.talk_time_percent,
    }),
    { tutorEyeContact: 0, studentEyeContact: 0, tutorTalk: 0, studentTalk: 0 }
  );

  const avgTutorEyeContact = sum.tutorEyeContact / n;
  const avgStudentEyeContact = sum.studentEyeContact / n;
  const avgTutorTalkPercent = sum.tutorTalk / n;
  const avgStudentTalkPercent = sum.studentTalk / n;

  // Student talk ratio: student's share of total talk time
  const totalTalk = avgTutorTalkPercent + avgStudentTalkPercent;
  const studentTalkRatio = totalTalk > 0
    ? avgStudentTalkPercent / totalTalk
    : 0;

  // Engagement score: weighted combination
  // - student talk ratio (higher is better): 40%
  // - tutor eye contact: 20%
  // - student eye contact: 40%
  const engagementScore =
    0.4 * studentTalkRatio +
    0.2 * avgTutorEyeContact +
    0.4 * avgStudentEyeContact;

  return {
    sessionId,
    durationSec: n, // 1 sample per second
    avgTutorEyeContact,
    avgStudentEyeContact,
    avgTutorTalkPercent,
    avgStudentTalkPercent,
    studentTalkRatio,
    engagementScore,
    sampleCount: n,
    ...(interruptionData ? { interruptions: interruptionData } : {}),
  };
}
