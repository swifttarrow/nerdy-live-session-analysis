import type { SessionMetrics } from "@metrics-engine/metrics-schema";
import {
  TRIGGERS,
  TriggerType,
  createInitialTriggerState,
  updateTriggerState,
} from "./triggers";
import { DEFAULT_CONFIG, CoachingConfig } from "./config";
import type { KudosEvent } from "./kudos";
import type { SessionPreset } from "./presets";

export interface NudgeEvent {
  id: string;
  type: TriggerType;
  headline: string;
  suggestion: string;
  timestamp: number;
}

export interface CoachingEngine {
  evaluate(metrics: SessionMetrics): void;
  /** Record a tutor→student interruption for the spike trigger (M10) */
  recordTutorInterruption(): void;
}

const KUDOS_GOOD_WAIT_TIME_COOLDOWN_MS = 90_000;

export interface CoachingEngineOptions {
  /** Optional: called when good wait time detected (Socratic kudos 3) */
  onKudos?: (kudos: KudosEvent) => void;
  /** Preset getter; kudos only fire when preset is "socratic" */
  preset?: () => SessionPreset;
}

/**
 * Rule-based coaching engine with per-trigger cooldowns.
 *
 * State machine per trigger:
 *   IDLE → condition met → FIRED → cooldown elapsed → IDLE
 */
export function createCoachingEngine(
  onNudge: (nudge: NudgeEvent) => void,
  config: CoachingConfig = DEFAULT_CONFIG,
  options?: CoachingEngineOptions
): CoachingEngine {
  let triggerState = createInitialTriggerState();

  // Track last fire time per trigger type
  const lastFiredAt: Partial<Record<TriggerType, number>> = {};
  let lastGoodWaitTimeFiredAt = 0;

  function inCooldown(type: TriggerType, now: number): boolean {
    const last = lastFiredAt[type];
    if (last === undefined) return false;
    return (now - last) / 1000 < config.cooldownSec;
  }

  function fire(trigger: (typeof TRIGGERS)[number], now: number) {
    lastFiredAt[trigger.type] = now;
    const nudge: NudgeEvent = {
      id: `${trigger.type}-${now}`,
      type: trigger.type,
      headline: trigger.headline,
      suggestion: trigger.suggestion,
      timestamp: now,
    };
    onNudge(nudge);
  }

  return {
    evaluate(metrics: SessionMetrics) {
      const now = Date.now();

      // Update accumulated state (called at 1 Hz)
      const update = updateTriggerState(triggerState, metrics, config, now);
      triggerState = update.state;

      // Kudos 3: Good wait time (Socratic only)
      if (
        update.goodWaitTime &&
        options?.onKudos &&
        options?.preset?.() === "socratic" &&
        now - lastGoodWaitTimeFiredAt >= KUDOS_GOOD_WAIT_TIME_COOLDOWN_MS
      ) {
        lastGoodWaitTimeFiredAt = now;
        options.onKudos({
          id: `kudos-good_wait_time-${now}`,
          type: "good_wait_time",
          headline: "Great use of wait time!",
          message:
            "You gave the student space to think before they responded.",
          timestamp: now,
        });
      }

      for (const trigger of TRIGGERS) {
        if (inCooldown(trigger.type, now)) continue;
        if (trigger.evaluate(metrics, triggerState, config)) {
          fire(trigger, now);
        }
      }
    },

    recordTutorInterruption() {
      triggerState = {
        ...triggerState,
        recentTutorInterruptionTimes: [
          ...triggerState.recentTutorInterruptionTimes,
          Date.now(),
        ],
      };
    },
  };
}
