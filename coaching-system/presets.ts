import type { CoachingConfig } from "./config";
import { DEFAULT_CONFIG } from "./config";
import { STORAGE_KEYS } from "./constants";

export type SessionPreset = "lecture" | "practice" | "socratic";

/** Fallback preset when nothing is stored (no default mode toggle) */
export const INITIAL_PRESET: SessionPreset = "lecture";

export interface PresetDefinition {
  id: SessionPreset;
  label: string;
  tooltip: string;
  config: Partial<CoachingConfig>;
}

export const SESSION_PRESETS: PresetDefinition[] = [
  {
    id: "lecture",
    label: "Lecture",
    tooltip:
      "• Tutor monologue up to 5 minutes before a nudge\n• Best for explaining concepts",
    config: {
      tutorMonologueThresholdSec: 300, // 5 min
    },
  },
  {
    id: "practice",
    label: "Practice",
    tooltip:
      "• Tutor monologue over 60 seconds triggers a nudge\n• Best when student works through problems with guidance",
    config: {
      tutorMonologueThresholdSec: 60,
    },
  },
  {
    id: "socratic",
    label: "Socratic",
    tooltip:
      "• Tutor monologue over 30 seconds triggers a nudge\n• Shorter cooldowns; best for student-led discussion",
    config: {
      tutorMonologueThresholdSec: 30,
      cooldownSec: 60,
    },
  },
];

export function getPresetConfig(preset: SessionPreset): Partial<CoachingConfig> {
  return SESSION_PRESETS.find((p) => p.id === preset)?.config ?? {};
}

export function applyPreset(base: CoachingConfig, preset: SessionPreset): CoachingConfig {
  return { ...base, ...getPresetConfig(preset) };
}

export function loadPreset(): SessionPreset {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PRESET);
    if (["lecture", "practice", "socratic"].includes(stored ?? "")) {
      return stored as SessionPreset;
    }
  } catch {}
  return INITIAL_PRESET;
}

export function savePreset(preset: SessionPreset): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESET, preset);
  } catch {}
}

// Re-export DEFAULT_CONFIG for consumers that need it alongside presets
export { DEFAULT_CONFIG };
