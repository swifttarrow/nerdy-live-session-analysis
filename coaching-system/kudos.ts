/**
 * Socratic kudos — positive reinforcement for tutor behaviors.
 * Only active when session preset is "socratic".
 *
 * Kudos 1: Open-ended probing questions (why, how, what makes you think)
 * Kudos 2: Probe assumptions and beliefs (LLM-evaluated)
 * Kudos 4: Hypotheticals / "what if" scenarios
 */

import type { SessionPreset } from "./presets";

export type KudosType =
  | "open_ended_question"
  | "probe_assumptions"
  | "hypothetical_scenario";

export interface KudosEvent {
  id: string;
  type: KudosType;
  headline: string;
  message: string;
  timestamp: number;
}

// Kudos 1: Open-ended probing questions
const OPEN_ENDED_PATTERNS = [
  /\bwhy\b/i,
  /\bhow\b/i,
  /\bwhat makes you think\b/i,
  /\bcan you give (me )?an example\b/i,
  /\bwhat do you notice\b/i,
  /\bwhat do you think\b/i,
  /\bwhat happens if\b/i,
  /\bwhat would happen\b/i,
  /\bexplain (your |that )?reasoning\b/i,
  /\bwalk me through\b/i,
];

function isOpenEndedQuestion(transcript: string): boolean {
  const t = transcript.trim();
  if (t.length < 10) return false;
  return OPEN_ENDED_PATTERNS.some((p) => p.test(t));
}

// Kudos 4: Hypotheticals / "what if"
const HYPOTHETICAL_PATTERNS = [
  /\bwhat if\b/i,
  /\bsuppose\b/i,
  /\bimagine\b/i,
  /\blet'?s say\b/i,
  /\bwhat would happen if\b/i,
  /\bif .+ (then|what)\b/i,
];

function isHypotheticalScenario(transcript: string): boolean {
  const t = transcript.trim();
  if (t.length < 8) return false;
  return HYPOTHETICAL_PATTERNS.some((p) => p.test(t));
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
    transcribeUrl?: string;
    probeAssumptionsUrl?: string;
  }
): KudosEngine {
  const lastFiredAt: Record<KudosType, number> = {
    open_ended_question: 0,
    probe_assumptions: 0,
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

  return {
    async onTranscript(transcript: string) {
      if (options.preset() !== "socratic") return;

      const t = transcript.trim();
      if (t.length < 5) return;

      const now = Date.now();

      // Kudos 1: Open-ended probing questions
      if (!inCooldown("open_ended_question", now) && isOpenEndedQuestion(t)) {
        fire(
          "open_ended_question",
          "Great probing question!",
          "You're using open-ended questions to push for deeper understanding.",
          now
        );
        return; // Only one kudos per transcript
      }

      // Kudos 4: Hypotheticals
      if (!inCooldown("hypothetical_scenario", now) && isHypotheticalScenario(t)) {
        fire(
          "hypothetical_scenario",
          "Nice use of hypotheticals!",
          "You're challenging the student to apply their thinking to new situations.",
          now
        );
        return;
      }

      // Kudos 2: Probe assumptions (LLM)
      if (!inCooldown("probe_assumptions", now) && t.length >= 15) {
        const url = options.probeAssumptionsUrl ?? "/api/kudos/probe-assumptions";
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: t }),
          });
          if (res.ok) {
            const { probes } = (await res.json()) as { probes?: boolean };
            if (probes) {
              fire(
                "probe_assumptions",
                "Probing assumptions effectively!",
                "You're challenging the student's reasoning to strengthen their logic.",
                now
              );
            }
          }
        } catch (err) {
          console.warn("[KudosEngine] probe-assumptions failed:", err);
        }
      }
    },

    destroy() {
      // No persistent state to clean
    },
  };
}
