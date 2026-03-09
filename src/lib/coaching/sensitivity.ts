import type { CoachingConfig } from "./config";

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
  },
};

export function applySensitivity(
  base: CoachingConfig,
  level: SensitivityLevel
): CoachingConfig {
  return { ...base, ...SENSITIVITY_CONFIGS[level] };
}

const STORAGE_KEY = "sessionlens-sensitivity";

/** Slider percent (0–100) → sensitivity level. 0–33 low, 34–66 medium, 67–100 high. */
export function percentToLevel(percent: number): SensitivityLevel {
  if (percent <= 33) return "low";
  if (percent <= 66) return "medium";
  return "high";
}

export function loadSensitivityPercent(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "low" || stored === "medium" || stored === "high") {
      const migrated = stored === "low" ? 16 : stored === "medium" ? 50 : 84;
      saveSensitivityPercent(migrated);
      return migrated;
    }
    const n = parseInt(stored ?? "", 10);
    if (!Number.isNaN(n) && n >= 0 && n <= 100) return n;
  } catch {}
  return 50;
}

export function saveSensitivityPercent(percent: number): void {
  try {
    const clamped = Math.round(Math.max(0, Math.min(100, percent)));
    localStorage.setItem(STORAGE_KEY, String(clamped));
  } catch {}
}
