import type { SessionMetrics } from "@/lib/session/metrics-schema";
import {
  TRIGGERS,
  TriggerType,
  createInitialTriggerState,
  updateTriggerState,
} from "./triggers";
import { DEFAULT_CONFIG, CoachingConfig } from "./config";

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

/**
 * Rule-based coaching engine with per-trigger cooldowns.
 *
 * State machine per trigger:
 *   IDLE → condition met → FIRED → cooldown elapsed → IDLE
 */
export function createCoachingEngine(
  onNudge: (nudge: NudgeEvent) => void,
  config: CoachingConfig = DEFAULT_CONFIG
): CoachingEngine {
  let triggerState = createInitialTriggerState();

  // Track last fire time per trigger type
  const lastFiredAt: Partial<Record<TriggerType, number>> = {};

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
      triggerState = updateTriggerState(triggerState, metrics, config, now);

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
