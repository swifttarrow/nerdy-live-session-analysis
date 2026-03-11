import type { CoachingConfig } from "./config";
import { DEFAULT_CONFIG } from "./config";
import { STORAGE_KEYS, DEFAULT_SESSION_PRESET } from "./constants";

export type SessionPreset = "lecture" | "practice" | "socratic";

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
      "• Student ideally talks ~30% of the time\n• Tutor-led; student silence up to 90 seconds before a nudge\n• Best for explaining concepts",
    config: {
      tutorTalkThreshold: 0.92, // higher tolerance for tutor talk
      studentSilentSec: 90,     // longer silence OK during explanations
    },
  },
  {
    id: "practice",
    label: "Practice",
    tooltip:
      "• Student ideally talks ~50% of the time\n• Balanced; student silence over 30 seconds triggers a nudge\n• Best when student works through problems with guidance",
    config: {
      tutorTalkThreshold: 0.80,
      studentSilentSec: 30, // student silence during practice is a concern
    },
  },
  {
    id: "socratic",
    label: "Socratic",
    tooltip:
      "• Student ideally talks ~70% of the time\n• Student-led; silence over 20 seconds triggers a nudge\n• Shorter cooldowns; best for discussion",
    config: {
      tutorTalkThreshold: 0.70, // tutor should speak much less
      studentSilentSec: 20,
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
  return DEFAULT_SESSION_PRESET;
}

export function savePreset(preset: SessionPreset): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESET, preset);
  } catch {}
}

// Re-export DEFAULT_CONFIG for consumers that need it alongside presets
export { DEFAULT_CONFIG };
