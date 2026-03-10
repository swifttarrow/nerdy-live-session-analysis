import type { NudgeEvent } from "@coaching-system/engine";
import { MS_PER_SEC, SEC_PER_MIN, SEVERITY, TRIGGER_SEVERITY } from "./constants";

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
    sessionOffsetSec: Math.round((nudge.timestamp - sessionStartMs) / MS_PER_SEC),
    reason: nudge.headline,
    severity: severityForType(nudge.type),
  }));
}

function severityForType(type: string): FlaggedMoment["severity"] {
  return TRIGGER_SEVERITY[type] ?? SEVERITY.INFO;
}

/** Format a session offset (seconds) as mm:ss */
export function formatOffset(sec: number): string {
  if (sec < 0) return "0:00";
  const m = Math.floor(sec / SEC_PER_MIN);
  const s = sec % SEC_PER_MIN;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
