/**
 * Socratic kudos — positive reinforcement for tutor behaviors.
 * Only active when session preset is "socratic".
 *
 * Kudos 1: Open-ended probing questions — detected via LLM (gpt-4.1-nano)
 * Kudos 3: Allow time for critical thinking (wait time) — fired from coaching engine
 * Kudos 4: Hypotheticals / "what if" scenarios — detected via LLM (gpt-4.1-nano)
 */

import type { SessionPreset } from "./presets";

export type KudosType =
  | "open_ended_question"
  | "good_wait_time"
  | "hypothetical_scenario";

export interface KudosEvent {
  id: string;
  type: KudosType;
  headline: string;
  message: string;
  timestamp: number;
}

export interface KudosClassification {
  open_ended_question: boolean;
  hypothetical_scenario: boolean;
}

export interface KudosEngine {
  onTranscript(transcript: string): Promise<void>;
  destroy(): void;
}

const COOLDOWN_MS = 90_000; // 90 seconds per kudos type

export function createKudosEngine(
  onKudos: (kudos: KudosEvent) => void,
  options: {
    preset: () => SessionPreset;
    /** URL for POST /api/classify-kudos; required for transcript-based kudos */
    classifyKudosUrl: string;
    /** Optional: inject for testing; bypasses fetch when provided. Return null on failure. */
    classifyFn?: (text: string) => Promise<KudosClassification | null>;
  }
): KudosEngine {
  const lastFiredAt: Record<KudosType, number> = {
    open_ended_question: 0,
    good_wait_time: 0,
    hypothetical_scenario: 0,
  };

  function inCooldown(type: KudosType, now: number): boolean {
    return now - lastFiredAt[type] < COOLDOWN_MS;
  }

  function fire(type: KudosType, headline: string, message: string, now: number) {
    lastFiredAt[type] = now;
    onKudos({
      id: `kudos-${type}-${now}`,
      type,
      headline,
      message,
      timestamp: now,
    });
  }

  async function classify(text: string): Promise<KudosClassification | null> {
    if (options.classifyFn) {
      return options.classifyFn(text);
    }
    try {
      const res = await fetch(options.classifyKudosUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as KudosClassification;
      return {
        open_ended_question: Boolean(data.open_ended_question),
        hypothetical_scenario: Boolean(data.hypothetical_scenario),
      };
    } catch {
      return null;
    }
  }

  return {
    async onTranscript(transcript: string) {
      if (options.preset() !== "socratic") return;

      const t = transcript.trim();
      if (t.length < 5) return;

      let classification: KudosClassification | null;
      try {
        classification = await classify(t);
      } catch {
        return;
      }
      if (!classification) return;

      const now = Date.now();

      // Kudos 1: Open-ended probing questions
      if (
        !inCooldown("open_ended_question", now) &&
        classification.open_ended_question
      ) {
        fire(
          "open_ended_question",
          "Great probing question!",
          "You're using open-ended questions to push for deeper understanding.",
          now
        );
        return; // Only one kudos per transcript
      }

      // Kudos 4: Hypotheticals
      if (
        !inCooldown("hypothetical_scenario", now) &&
        classification.hypothetical_scenario
      ) {
        fire(
          "hypothetical_scenario",
          "Nice use of hypotheticals!",
          "You're challenging the student to apply their thinking to new situations.",
          now
        );
      }
    },

    destroy() {
      // No persistent state to clean
    },
  };
}
