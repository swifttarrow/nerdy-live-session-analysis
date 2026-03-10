import type { SessionMetrics } from "@metrics-engine/metrics-schema";
import type { InterruptionStats } from "@metrics-engine/audio/interruptions";
import type { InterruptionClassification } from "@metrics-engine/audio/interruption-classification";
import type { SessionPreset } from "@coaching-system/presets";
import {
  classifyParticipation,
  participationDescription,
  type ParticipationLabel,
} from "./participation";
import { segmentAttention, type AttentionCycles } from "./attention-cycles";
import { computeTalkBalanceScore } from "./talk-balance";
import type { SessionTrends } from "./trends";

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
  /** M21: average response latency in ms */
  avgResponseLatencyMs?: number;
  /** M21: number of hesitation-length turns */
  hesitationCount?: number;
  /** M22: participation label */
  participationLabel?: ParticipationLabel;
  participationDescription?: string;
  /** M23: attention cycles by time segment */
  attentionCycles?: AttentionCycles;
  /** M24: trends vs prior sessions (added externally after report generation) */
  trends?: SessionTrends;
}

export interface AggregateSessionSummaryOptions {
  interruptionData?: (InterruptionStats & { classification: InterruptionClassification }) | null;
  preset?: SessionPreset;
}

/**
 * Aggregate session metrics history into a summary.
 */
export function aggregateSessionSummary(
  sessionId: string,
  metricsHistory: SessionMetrics[],
  interruptionDataOrOptions?:
    | (InterruptionStats & { classification: InterruptionClassification })
    | AggregateSessionSummaryOptions
    | null
): SessionSummary {
  const isRawInterruption =
    interruptionDataOrOptions && "classification" in interruptionDataOrOptions;
  const interruptionData = isRawInterruption
    ? interruptionDataOrOptions
    : (interruptionDataOrOptions as AggregateSessionSummaryOptions)?.interruptionData ?? null;
  const preset = !isRawInterruption
    ? (interruptionDataOrOptions as AggregateSessionSummaryOptions)?.preset
    : undefined;
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
      participationLabel: classifyParticipation(0),
      participationDescription: participationDescription(classifyParticipation(0)),
      attentionCycles: { segments: [], pattern: null },
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
  // - talk balance (Gaussian curve, center varies by preset): 40%
  // - tutor eye contact: 20%
  // - student eye contact: 40%
  const talkBalanceScore = computeTalkBalanceScore(studentTalkRatio, preset);
  const engagementScore =
    0.4 * talkBalanceScore +
    0.2 * avgTutorEyeContact +
    0.4 * avgStudentEyeContact;

  // M22: participation label
  const pLabel = classifyParticipation(studentTalkRatio);
  const pDesc = participationDescription(pLabel);

  // M23: attention cycles
  const attentionCycles = segmentAttention(metricsHistory);

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
    participationLabel: pLabel,
    participationDescription: pDesc,
    attentionCycles,
    ...(interruptionData ? { interruptions: interruptionData } : {}),
  };
}
