import type { CoachingConfig } from "./config";
import { DEFAULT_CONFIG } from "./config";

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
      "• Tutor can talk up to 92% of the time\n• Student silence up to 90 seconds before a nudge\n• Best for explaining concepts",
    config: {
      tutorTalkThreshold: 0.92, // higher tolerance for tutor talk
      studentSilentSec: 90,     // longer silence OK during explanations
    },
  },
  {
    id: "practice",
    label: "Practice",
    tooltip:
      "• Tutor talk up to 80%\n• Student silence over 30 seconds triggers a nudge\n• Best when student works through problems with guidance",
    config: {
      tutorTalkThreshold: 0.80,
      studentSilentSec: 30, // student silence during practice is a concern
    },
  },
  {
    id: "socratic",
    label: "Socratic",
    tooltip:
      "• Tutor should stay under 70% talk\n• Student silence over 20 seconds triggers a nudge\n• Shorter cooldowns; best for student-led discussion",
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

const STORAGE_KEY = "sessionlens-preset";

export function loadPreset(): SessionPreset {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (["lecture", "practice", "socratic"].includes(stored ?? "")) {
      return stored as SessionPreset;
    }
  } catch {}
  return "socratic";
}

export function savePreset(preset: SessionPreset): void {
  try {
    localStorage.setItem(STORAGE_KEY, preset);
  } catch {}
}

// Re-export DEFAULT_CONFIG for consumers that need it alongside presets
export { DEFAULT_CONFIG };
