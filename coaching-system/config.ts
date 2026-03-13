/**
 * Coaching trigger thresholds (in-memory for MVP).
 * All values aligned with ONE_PAGER specifications.
 */
export interface CoachingConfig {
  /** Student silent for this many seconds → trigger nudge */
  studentSilentSec: number;
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
  // Student emotion trigger
  /** Seconds student must show negative emotion before nudge */
  studentNegativeSec: number;
  // Tutor monologue trigger
  /** Tutor monologue above this (seconds) → nudge */
  tutorMonologueThresholdSec: number;
  // Turn-taking frequency trigger
  /** Turns per minute below this → nudge "involve student more" */
  turnTakingMinPerMinute: number;
  /** Minimum session duration (sec) before turn_taking_low can fire */
  turnTakingMinSessionSec: number;
  /** Socratic kudos: response latency in this range (ms) = good wait time */
  goodWaitTimeMinMs: number;
  goodWaitTimeMaxMs: number;
}

export const DEFAULT_CONFIG: CoachingConfig = {
  studentSilentSec: 45,
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
  studentNegativeSec: 10,
  // Tutor monologue (60–120s typical)
  tutorMonologueThresholdSec: 90,
  // Turn-taking: healthy tutoring has frequent handoffs
  turnTakingMinPerMinute: 0.5,
  turnTakingMinSessionSec: 60,
  // Socratic kudos: good wait time = 3–8 seconds
  goodWaitTimeMinMs: 3_000,
  goodWaitTimeMaxMs: 8_000,
};
