import type { CoachingConfig } from "./config";
import {
  STORAGE_KEYS,
  SENSITIVITY_PERCENT_BOUNDARIES,
  SENSITIVITY_MIGRATE_PERCENT,
  DEFAULT_SENSITIVITY_PERCENT,
} from "./constants";

export type SensitivityLevel = "low" | "medium" | "high";

export const SENSITIVITY_CONFIGS: Record<SensitivityLevel, Partial<CoachingConfig>> = {
  low: {
    studentSilentSec: 60,
    tutorTalkThreshold: 0.90,
    eyeContactThreshold: 0.4,
    eyeContactDurationSec: 45,
    cooldownSec: 180,
    hesitationThresholdMs: 8_000,
    hesitationCountThreshold: 4,
    studentNegativeSec: 20,
  },
  medium: {}, // uses DEFAULT_CONFIG as-is
  high: {
    studentSilentSec: 30,
    tutorTalkThreshold: 0.80,
    eyeContactThreshold: 0.5,
    eyeContactDurationSec: 20,
    cooldownSec: 90,
    hesitationThresholdMs: 3_000,
    hesitationCountThreshold: 2,
    studentNegativeSec: 6,
  },
};

export function applySensitivity(
  base: CoachingConfig,
  level: SensitivityLevel
): CoachingConfig {
  return { ...base, ...SENSITIVITY_CONFIGS[level] };
}

/** Slider percent (0–100) → sensitivity level. 0–33 low, 34–66 medium, 67–100 high. */
export function percentToLevel(percent: number): SensitivityLevel {
  if (percent <= SENSITIVITY_PERCENT_BOUNDARIES.LOW_MAX) return "low";
  if (percent <= SENSITIVITY_PERCENT_BOUNDARIES.MEDIUM_MAX) return "medium";
  return "high";
}

export function loadSensitivityPercent(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SENSITIVITY);
    if (stored === "low" || stored === "medium" || stored === "high") {
      const migrated =
        stored === "low"
          ? SENSITIVITY_MIGRATE_PERCENT.LOW
          : stored === "medium"
            ? SENSITIVITY_MIGRATE_PERCENT.MEDIUM
            : SENSITIVITY_MIGRATE_PERCENT.HIGH;
      saveSensitivityPercent(migrated);
      return migrated;
    }
    const n = parseInt(stored ?? "", 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 100) return n;
  } catch {}
  return DEFAULT_SENSITIVITY_PERCENT;
}

export function saveSensitivityPercent(percent: number): void {
  try {
    const clamped = Math.round(Math.max(0, Math.min(100, percent)));
    localStorage.setItem(STORAGE_KEYS.SENSITIVITY, String(clamped));
  } catch {}
}
