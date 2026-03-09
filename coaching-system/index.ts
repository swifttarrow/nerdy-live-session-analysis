/**
 * coaching-system - Real-time suggestion generation
 *
 * Rule-based coaching engine with configurable triggers and presets.
 */

export { createCoachingEngine } from "./engine";
export type { CoachingEngine, NudgeEvent } from "./engine";
export { DEFAULT_CONFIG } from "./config";
export type { CoachingConfig } from "./config";
export { TRIGGERS, createInitialTriggerState, updateTriggerState } from "./triggers";
export type { TriggerType, Trigger, TriggerState } from "./triggers";
export {
  SESSION_PRESETS,
  getPresetConfig,
  applyPreset,
  loadPreset,
  savePreset,
} from "./presets";
export type { SessionPreset, PresetDefinition } from "./presets";
export {
  applySensitivity,
  percentToLevel,
  loadSensitivityPercent,
  saveSensitivityPercent,
  SENSITIVITY_CONFIGS,
} from "./sensitivity";
export type { SensitivityLevel } from "./sensitivity";
