/**
 * Coaching trigger thresholds (in-memory for MVP).
 * All values aligned with ONE_PAGER specifications.
 */
export interface CoachingConfig {
  /** Student silent for this many seconds → trigger nudge */
  studentSilentSec: number;
  /** Tutor talk-time above this fraction → trigger nudge */
  tutorTalkThreshold: number;
  /** Eye contact below this score for this many seconds → trigger nudge */
  eyeContactThreshold: number;
  eyeContactDurationSec: number;
  /** Cooldown between same trigger fires (seconds) */
  cooldownSec: number;
}

export const DEFAULT_CONFIG: CoachingConfig = {
  studentSilentSec: 45,
  tutorTalkThreshold: 0.85,
  eyeContactThreshold: 0.5,
  eyeContactDurationSec: 30,
  cooldownSec: 120,
};
