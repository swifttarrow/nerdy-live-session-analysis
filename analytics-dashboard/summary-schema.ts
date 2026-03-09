import { z } from "zod";

/**
 * Zod schema for SessionSummary as received by the recommendations API.
 * Validates required fields for LLM prompt construction.
 */
export const SessionSummarySchema = z.object({
  sessionId: z.string(),
  durationSec: z.number().min(0),
  avgTutorEyeContact: z.number().min(0).max(1),
  avgStudentEyeContact: z.number().min(0).max(1),
  avgTutorTalkPercent: z.number().min(0).max(1),
  avgStudentTalkPercent: z.number().min(0).max(1),
  studentTalkRatio: z.number().min(0).max(1),
  engagementScore: z.number().min(0).max(1),
  sampleCount: z.number().min(0),
  interruptions: z
    .object({
      totalOverlaps: z.number().min(0),
      classification: z.object({
        productive: z.number().min(0),
        neutral: z.number().min(0),
        unproductive: z.number().min(0),
      }),
    })
    .optional(),
}).passthrough();

export type SessionSummaryInput = z.infer<typeof SessionSummarySchema>;
