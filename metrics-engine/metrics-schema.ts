import { z } from "zod";

/** Student emotional states from face analysis (3 consolidated states) */
export const EmotionalStateSchema = z.enum(["positive", "neutral", "negative"]);
export type EmotionalState = z.infer<typeof EmotionalStateSchema>;

export const ParticipantMetricsSchema = z.object({
  eye_contact_score: z.number().min(0).max(1),
  /** True when we've received at least one valid score; false = no face detected yet */
  face_detected: z.boolean().optional(),
  talk_time_percent: z.number().min(0).max(1),
  current_speaking: z.boolean(),
  /** M11: combined voice + expression energy level [0, 1] */
  energy_level: z.number().min(0).max(1).optional(),
  /** M12: sustained attention drift (looking away > threshold) */
  attention_drift: z.boolean().optional(),
  /** Student emotional state from face landmarks (positive, neutral, negative) */
  emotional_state: EmotionalStateSchema.optional(),
  /** Rolling-window talk ratio (2–5 min) for realtime nudge; uses this when available */
  talk_time_percent_rolling: z.number().min(0).max(1).optional(),
  /** Tutor only: current/last monologue length in seconds */
  tutor_monologue_sec: z.number().min(0).optional(),
  /** Tutor only: tutor→student handoffs per minute in rolling window */
  tutor_turns_per_minute: z.number().min(0).optional(),
});

export const SessionMetricsSchema = z.object({
  timestamp: z.string().datetime(),
  session_id: z.string(),
  /** Session start timestamp (ms) for trigger warm-up checks */
  session_start_ms: z.number().optional(),
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
