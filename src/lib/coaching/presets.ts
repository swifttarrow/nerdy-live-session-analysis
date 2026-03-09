import type { CoachingConfig } from "./config";
import { DEFAULT_CONFIG } from "./config";

export type SessionPreset = "general" | "lecture" | "practice" | "socratic";

export interface PresetDefinition {
  id: SessionPreset;
  label: string;
  description: string;
  config: Partial<CoachingConfig>;
}

export const SESSION_PRESETS: PresetDefinition[] = [
  {
    id: "general",
    label: "General",
    description: "Standard tutoring session",
    config: {},
  },
  {
    id: "lecture",
    label: "Lecture",
    description: "Tutor explains concepts; higher tutor talk is expected",
    config: {
      tutorTalkThreshold: 0.92, // higher tolerance for tutor talk
      studentSilentSec: 90,     // longer silence OK during explanations
    },
  },
  {
    id: "practice",
    label: "Practice",
    description: "Student works through problems with tutor guidance",
    config: {
      tutorTalkThreshold: 0.80,
      studentSilentSec: 30, // student silence during practice is a concern
    },
  },
  {
    id: "socratic",
    label: "Socratic",
    description: "Student-led; high student talk expected",
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
    if (["general", "lecture", "practice", "socratic"].includes(stored ?? "")) {
      return stored as SessionPreset;
    }
  } catch {}
  return "general";
}

export function savePreset(preset: SessionPreset): void {
  try {
    localStorage.setItem(STORAGE_KEY, preset);
  } catch {}
}

// Re-export DEFAULT_CONFIG for consumers that need it alongside presets
export { DEFAULT_CONFIG };
