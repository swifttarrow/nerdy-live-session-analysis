/**
 * Attention drift detection from gaze patterns.
 * Per post-MVP plan: sustained low eye contact (>5s) → drift.
 * Brief glances (<2s) are not flagged.
 */

export interface DriftDetectorOptions {
  /** Consecutive seconds of low gaze that triggers drift (default: 5) */
  driftThresholdSec?: number;
  /** Eye contact score below this is "looking away" (default: 0.4) */
  gazeAwayThreshold?: number;
}

export interface DriftDetectorState {
  /** How many consecutive seconds gaze has been below threshold */
  consecutiveLowGazeSec: number;
  /** Whether drift is currently active */
  isDrifting: boolean;
}

export interface DriftDetector {
  /**
   * Feed a new eye contact score (call at ~1 Hz).
   * Returns true if participant is currently drifting.
   */
  update(eyeContactScore: number): boolean;
  getState(): DriftDetectorState;
  reset(): void;
}

const DEFAULT_OPTIONS: Required<DriftDetectorOptions> = {
  driftThresholdSec: 5,
  gazeAwayThreshold: 0.4,
};

/**
 * Create a drift detector.
 *
 * State machine:
 *   - Gaze away (score < threshold): consecutiveLowGazeSec++
 *   - Gaze returns (score >= threshold): reset consecutive counter + isDrifting=false
 *   - consecutiveLowGazeSec >= driftThresholdSec: isDrifting=true
 *
 * Brief glances are filtered because the consecutive counter only accumulates
 * when gaze is away, and resets immediately on return — so short dips below
 * threshold never reach the drift threshold.
 */
export function createDriftDetector(options: DriftDetectorOptions = {}): DriftDetector {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let consecutiveLowGazeSec = 0;
  let isDrifting = false;

  return {
    update(eyeContactScore: number): boolean {
      if (eyeContactScore < opts.gazeAwayThreshold) {
        consecutiveLowGazeSec += 1;
        if (consecutiveLowGazeSec >= opts.driftThresholdSec) {
          isDrifting = true;
        }
      } else {
        // Gaze returned: reset drift
        consecutiveLowGazeSec = 0;
        isDrifting = false;
      }
      return isDrifting;
    },

    getState(): DriftDetectorState {
      return { consecutiveLowGazeSec, isDrifting };
    },

    reset() {
      consecutiveLowGazeSec = 0;
      isDrifting = false;
    },
  };
}
