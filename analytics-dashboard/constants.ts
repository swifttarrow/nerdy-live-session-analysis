/**
 * Constants for analytics and attention cycle analysis.
 */

/** Milliseconds per second for timestamp conversions */
export const MS_PER_SEC = 1000;

/** Seconds per minute for time formatting */
export const SEC_PER_MIN = 60;

/** Default number of segments when splitting session into attention phases */
export const DEFAULT_ATTENTION_SEGMENTS = 3;

/** Labels for 3-segment attention analysis */
export const ATTENTION_SEGMENT_LABELS = ["Beginning", "Middle", "End"] as const;

/** Threshold: boundary avg minus middle avg above this = "attention drifted in middle" */
export const ATTENTION_DRIFT_THRESHOLD = 0.2;

/** Tolerance when checking progressive decline (allow small fluctuations) */
export const ATTENTION_DECLINE_TOLERANCE = 0.05;

/** Total drop from first to last segment above this = "attention declined progressively" */
export const ATTENTION_DECLINE_THRESHOLD = 0.25;

/** Severity levels for flagged moments */
export const SEVERITY = {
  INFO: "info",
  WARNING: "warning",
  ALERT: "alert",
} as const;

/** Trigger type strings (mirrors TriggerType; includes emotion types for future nudges) */
export const TRIGGER_TYPES = {
  STUDENT_SILENT: "student_silent",
  TUTOR_TALK_DOMINANT: "tutor_talk_dominant",
  LOW_EYE_CONTACT: "low_eye_contact",
  INTERRUPTIONS_SPIKE: "interruptions_spike",
  STUDENT_HESITATING: "student_hesitating",
  STUDENT_ATTENTION_DRIFT: "student_attention_drift",
  STUDENT_TIRED: "student_tired",
  STUDENT_FRUSTRATED: "student_frustrated",
  STUDENT_DEFEATED: "student_defeated",
  STUDENT_CONFUSED: "student_confused",
  STUDENT_ANXIOUS: "student_anxious",
  STUDENT_BORED: "student_bored",
} as const;

/** Map trigger type to flagged moment severity */
export const TRIGGER_SEVERITY: Record<string, (typeof SEVERITY)[keyof typeof SEVERITY]> = {
  [TRIGGER_TYPES.STUDENT_SILENT]: SEVERITY.WARNING,
  [TRIGGER_TYPES.TUTOR_TALK_DOMINANT]: SEVERITY.WARNING,
  [TRIGGER_TYPES.INTERRUPTIONS_SPIKE]: SEVERITY.WARNING,
  [TRIGGER_TYPES.STUDENT_FRUSTRATED]: SEVERITY.WARNING,
  [TRIGGER_TYPES.STUDENT_CONFUSED]: SEVERITY.WARNING,
  [TRIGGER_TYPES.STUDENT_ANXIOUS]: SEVERITY.WARNING,
  [TRIGGER_TYPES.STUDENT_DEFEATED]: SEVERITY.WARNING,
  [TRIGGER_TYPES.LOW_EYE_CONTACT]: SEVERITY.INFO,
  [TRIGGER_TYPES.STUDENT_ATTENTION_DRIFT]: SEVERITY.INFO,
  [TRIGGER_TYPES.STUDENT_TIRED]: SEVERITY.INFO,
  [TRIGGER_TYPES.STUDENT_BORED]: SEVERITY.INFO,
  [TRIGGER_TYPES.STUDENT_HESITATING]: SEVERITY.ALERT,
};
