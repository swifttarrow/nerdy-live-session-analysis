import { z } from "zod";

/** Student emotional states from face analysis */
export const EmotionalStateSchema = z.enum(["neutral", "tired", "frustrated", "defeated"]);
export type EmotionalState = z.infer<typeof EmotionalStateSchema>;

export const ParticipantMetricsSchema = z.object({
  eye_contact_score: z.number().min(0).max(1),
  talk_time_percent: z.number().min(0).max(1),
  current_speaking: z.boolean(),
  /** M11: combined voice + expression energy level [0, 1] */
  energy_level: z.number().min(0).max(1).optional(),
  /** M12: sustained attention drift (looking away > threshold) */
  attention_drift: z.boolean().optional(),
  /** Student emotional state from face landmarks (tired, frustrated, defeated) */
  emotional_state: EmotionalStateSchema.optional(),
});

export const SessionMetricsSchema = z.object({
  timestamp: z.string().datetime(),
  session_id: z.string(),
  metrics: z.object({
    tutor: ParticipantMetricsSchema,
    student: ParticipantMetricsSchema,
  }),
});

export type ParticipantMetrics = z.infer<typeof ParticipantMetricsSchema>;
export type SessionMetrics = z.infer<typeof SessionMetricsSchema>;

/**
 * Validate a metrics payload. Returns parsed value or null on failure.
 */
export function validateMetrics(data: unknown): SessionMetrics | null {
  const result = SessionMetricsSchema.safeParse(data);
  if (!result.success) {
    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
      console.warn("Invalid metrics payload:", result.error.flatten());
    }
    return null;
  }
  return result.data;
}
