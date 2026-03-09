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
  // M10: interruptions spike trigger
  /** tutor→student interruption count within window to trigger nudge */
  interruptionSpikeThreshold: number;
  /** Time window (ms) for interruption spike counting */
  interruptionSpikeWindowMs: number;
  // M10: student hesitation / response latency trigger
  /** Response latency above this (ms) counts as a hesitation */
  hesitationThresholdMs: number;
  /** Number of hesitations within window to trigger nudge */
  hesitationCountThreshold: number;
  /** Time window (ms) for hesitation counting */
  hesitationWindowMs: number;
  // Student emotion triggers
  /** Seconds student must appear tired before nudge */
  studentTiredSec: number;
  /** Seconds student must appear frustrated before nudge */
  studentFrustratedSec: number;
  /** Seconds student must appear defeated before nudge */
  studentDefeatedSec: number;
}

export const DEFAULT_CONFIG: CoachingConfig = {
  studentSilentSec: 45,
  tutorTalkThreshold: 0.85,
  eyeContactThreshold: 0.5,
  eyeContactDurationSec: 30,
  cooldownSec: 120,
  // M10
  interruptionSpikeThreshold: 5,
  interruptionSpikeWindowMs: 120_000, // 2 min
  hesitationThresholdMs: 5_000,       // 5 s response latency = hesitation
  hesitationCountThreshold: 3,        // 3 long pauses in window
  hesitationWindowMs: 120_000,        // 2 min
  // Student emotion
  studentTiredSec: 15,
  studentFrustratedSec: 12,
  studentDefeatedSec: 12,
};
