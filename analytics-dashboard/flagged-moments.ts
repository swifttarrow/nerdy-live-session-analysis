import type { NudgeEvent } from "@coaching-system/engine";

export interface FlaggedMoment {
  timestampMs: number;
  /** Relative time from session start in seconds */
  sessionOffsetSec: number;
  reason: string;
  severity: "info" | "warning" | "alert";
}

/**
 * Convert coaching nudge events into flagged moments for the post-session report.
 * @param nudges - all nudge events fired during the session
 * @param sessionStartMs - timestamp when session started
 */
export function buildFlaggedMoments(
  nudges: NudgeEvent[],
  sessionStartMs: number
): FlaggedMoment[] {
  return nudges.map((nudge) => ({
    timestampMs: nudge.timestamp,
    sessionOffsetSec: Math.round((nudge.timestamp - sessionStartMs) / 1000),
    reason: nudge.headline,
    severity: severityForType(nudge.type),
  }));
}

function severityForType(type: string): FlaggedMoment["severity"] {
  switch (type) {
    case "student_silent":
    case "tutor_talk_dominant":
    case "interruptions_spike":
      return "warning";
    case "low_eye_contact":
    case "student_attention_drift":
      return "info";
    case "student_hesitating":
      return "alert";
    default:
      return "info";
  }
}

/** Format a session offset (seconds) as mm:ss */
export function formatOffset(sec: number): string {
  if (sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
