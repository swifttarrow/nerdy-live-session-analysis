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

export function loadSensitivity(): SensitivityLevel {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "low" || stored === "medium" || stored === "high") return stored;
  } catch {}
  return "medium";
}

export function saveSensitivity(level: SensitivityLevel): void {
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch {}
}
