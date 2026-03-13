import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCoachingEngine, NudgeEvent } from "@coaching-system/engine";
import { validateMetrics, type SessionMetrics } from "@metrics-engine/metrics-schema";
import type { CoachingConfig } from "@coaching-system/config";

const TEST_CONFIG: CoachingConfig = {
  studentSilentSec: 5,        // 5s for test speed
  eyeContactThreshold: 0.5,
  eyeContactDurationSec: 3,   // 3s for test speed
  cooldownSec: 60,
  // M10
  interruptionSpikeThreshold: 3,
  interruptionSpikeWindowMs: 120_000,
  hesitationThresholdMs: 5_000,
  hesitationCountThreshold: 3,
  hesitationWindowMs: 120_000,
  studentNegativeSec: 10,
  tutorMonologueThresholdSec: 90,
  turnTakingMinPerMinute: 0.5,
  turnTakingMinSessionSec: 0, // allow immediate fire in tests
  goodWaitTimeMinMs: 3_000,
  goodWaitTimeMaxMs: 8_000,
};

function makeMetrics(overrides: {
  tutorTalk?: number;
  studentTalk?: number;
  studentSpeaking?: boolean;
  tutorSpeaking?: boolean;
  tutorEyeContact?: number;
  studentEyeContact?: number;
  tutorMonologueSec?: number;
  tutorTurnsPerMinute?: number;
  studentEmotionalState?: "positive" | "neutral" | "negative";
} = {}): SessionMetrics {
  const tutor: SessionMetrics["metrics"]["tutor"] = {
    eye_contact_score: overrides.tutorEyeContact ?? 0.8,
    talk_time_percent: overrides.tutorTalk ?? 0.5,
    current_speaking: overrides.tutorSpeaking ?? true,
  };
  if (overrides.tutorMonologueSec !== undefined) tutor.tutor_monologue_sec = overrides.tutorMonologueSec;
  if (overrides.tutorTurnsPerMinute !== undefined) tutor.tutor_turns_per_minute = overrides.tutorTurnsPerMinute;

  return {
    timestamp: new Date().toISOString(),
    session_id: "test-session",
    metrics: {
      tutor,
      student: {
        eye_contact_score: overrides.studentEyeContact ?? 0.75,
        talk_time_percent: overrides.studentTalk ?? 0.5,
        current_speaking: overrides.studentSpeaking ?? true,
        ...(overrides.studentEmotionalState !== undefined
          ? { emotional_state: overrides.studentEmotionalState }
          : {}),
      },
    },
  };
}

describe("createCoachingEngine", () => {
  let nudges: NudgeEvent[];
  let engine: ReturnType<typeof createCoachingEngine>;

  beforeEach(() => {
    nudges = [];
    engine = createCoachingEngine((n) => nudges.push(n), TEST_CONFIG);
  });

  describe("student_silent trigger", () => {
    it("fires after student has been silent for studentSilentSec", () => {
      const m = makeMetrics({ studentSpeaking: false });
      // Simulate 5 evaluations (5 seconds with student silent)
      for (let i = 0; i < 6; i++) {
        engine.evaluate(m);
      }
      expect(nudges.some((n) => n.type === "student_silent")).toBe(true);
    });

    it("does not fire while student is speaking", () => {
      const m = makeMetrics({ studentSpeaking: true });
      for (let i = 0; i < 10; i++) {
        engine.evaluate(m);
      }
      expect(nudges.some((n) => n.type === "student_silent")).toBe(false);
    });

    it("resets silence counter when student starts speaking", () => {
      const silent = makeMetrics({ studentSpeaking: false });
      const speaking = makeMetrics({ studentSpeaking: true });
      // Build up 4 seconds of silence
      for (let i = 0; i < 4; i++) engine.evaluate(silent);
      // Student speaks — resets counter
      engine.evaluate(speaking);
      // 4 more seconds of silence — should NOT fire yet (counter reset)
      for (let i = 0; i < 4; i++) engine.evaluate(silent);
      expect(nudges.some((n) => n.type === "student_silent")).toBe(false);
    });
  });

  describe("low_eye_contact trigger", () => {
    it("fires after eye contact is low for eyeContactDurationSec", () => {
      const m = makeMetrics({ tutorEyeContact: 0.3 });
      for (let i = 0; i < 4; i++) engine.evaluate(m);
      expect(nudges.some((n) => n.type === "low_eye_contact")).toBe(true);
    });

    it("does not fire when eye contact is above threshold", () => {
      const m = makeMetrics({ tutorEyeContact: 0.8 });
      for (let i = 0; i < 10; i++) engine.evaluate(m);
      expect(nudges.some((n) => n.type === "low_eye_contact")).toBe(false);
    });
  });

  describe("tutor_monologue_long trigger", () => {
    it("fires when tutor monologue exceeds threshold", () => {
      const m = makeMetrics({ tutorMonologueSec: 95 });
      engine.evaluate(m);
      expect(nudges.some((n) => n.type === "tutor_monologue_long")).toBe(true);
    });

    it("does not fire when tutor monologue is below threshold", () => {
      const m = makeMetrics({ tutorMonologueSec: 60 });
      engine.evaluate(m);
      expect(nudges.some((n) => n.type === "tutor_monologue_long")).toBe(false);
    });

    it("does not fire when tutor_monologue_sec is undefined", () => {
      const m = makeMetrics();
      engine.evaluate(m);
      expect(nudges.some((n) => n.type === "tutor_monologue_long")).toBe(false);
    });
  });

  describe("turn_taking_low trigger", () => {
    it("fires when turns per minute is below threshold", () => {
      const m = makeMetrics({ tutorTurnsPerMinute: 0.3 });
      engine.evaluate(m);
      expect(nudges.some((n) => n.type === "turn_taking_low")).toBe(true);
    });

    it("does not fire when turns per minute meets threshold", () => {
      const m = makeMetrics({ tutorTurnsPerMinute: 0.8 });
      engine.evaluate(m);
      expect(nudges.some((n) => n.type === "turn_taking_low")).toBe(false);
    });

    it("does not fire when tutor_turns_per_minute is undefined", () => {
      const m = makeMetrics();
      engine.evaluate(m);
      expect(nudges.some((n) => n.type === "turn_taking_low")).toBe(false);
    });
  });

  describe("student_negative trigger", () => {
    it("fires after student shows negative emotion for studentNegativeSec", () => {
      const negativeConfig: CoachingConfig = {
        ...TEST_CONFIG,
        studentNegativeSec: 10,
        cooldownSec: 9999,
      };
      const negEngine = createCoachingEngine((n) => nudges.push(n), negativeConfig);
      const m = makeMetrics({ studentEmotionalState: "negative" });
      for (let i = 0; i < 11; i++) negEngine.evaluate(m);
      expect(nudges.some((n) => n.type === "student_negative")).toBe(true);
    });

    it("does not fire when student is positive or neutral", () => {
      const m = makeMetrics({ studentEmotionalState: "positive" });
      for (let i = 0; i < 20; i++) engine.evaluate(m);
      expect(nudges.some((n) => n.type === "student_negative")).toBe(false);
    });

    it("resets counter when student emotion becomes non-negative", () => {
      const negativeConfig: CoachingConfig = {
        ...TEST_CONFIG,
        studentNegativeSec: 10,
        cooldownSec: 9999,
      };
      const negEngine = createCoachingEngine((n) => nudges.push(n), negativeConfig);
      const negative = makeMetrics({ studentEmotionalState: "negative" });
      const neutral = makeMetrics({ studentEmotionalState: "neutral" });
      // 5 sec negative
      for (let i = 0; i < 5; i++) negEngine.evaluate(negative);
      // 1 sec neutral — resets
      negEngine.evaluate(neutral);
      // 5 more sec negative — should NOT fire yet (counter reset)
      for (let i = 0; i < 5; i++) negEngine.evaluate(negative);
      expect(nudges.some((n) => n.type === "student_negative")).toBe(false);
    });
  });

  describe("cooldown", () => {
    it("does not fire same trigger twice within cooldown period", () => {
      const shortCooldownConfig: CoachingConfig = {
        ...TEST_CONFIG,
        cooldownSec: 9999, // effectively never
      };
      const e2 = createCoachingEngine((n) => nudges.push(n), shortCooldownConfig);
      const m = makeMetrics({ tutorSpeaking: true, studentSpeaking: false });
      (m.metrics.tutor as Record<string, unknown>).tutor_monologue_sec = 95;
      // Evaluate many times
      for (let i = 0; i < 20; i++) e2.evaluate(m);
      const count = nudges.filter((n) => n.type === "tutor_monologue_long").length;
      expect(count).toBe(1); // fired exactly once due to cooldown
    });
  });

  describe("interruptions_spike trigger", () => {
    it("fires after recordTutorInterruption is called threshold times", () => {
      const m = makeMetrics();
      // Record enough interruptions to hit threshold (3 in TEST_CONFIG)
      for (let i = 0; i < 3; i++) {
        engine.recordTutorInterruption();
      }
      engine.evaluate(m);
      expect(nudges.some((n) => n.type === "interruptions_spike")).toBe(true);
    });

    it("does not fire below interruption threshold", () => {
      const m = makeMetrics();
      engine.recordTutorInterruption();
      engine.recordTutorInterruption();
      engine.evaluate(m);
      expect(nudges.some((n) => n.type === "interruptions_spike")).toBe(false);
    });

    it("respects cooldown after firing", () => {
      const m = makeMetrics();
      for (let i = 0; i < 3; i++) engine.recordTutorInterruption();
      engine.evaluate(m);
      // Record more interruptions — should not fire again due to cooldown
      for (let i = 0; i < 3; i++) engine.recordTutorInterruption();
      engine.evaluate(m);
      const count = nudges.filter((n) => n.type === "interruptions_spike").length;
      expect(count).toBe(1);
    });
  });

  describe("student_hesitating trigger", () => {
    it("fires after student hesitates multiple times within window", () => {
      // Simulate: tutor speaks then stops, student eventually starts (long latency)
      const tutorSpeaking = makeMetrics({ studentSpeaking: false });
      const tutorStopped = makeMetrics({ studentSpeaking: false });
      // Override tutor speaking state
      tutorSpeaking.metrics.tutor.current_speaking = true;
      tutorStopped.metrics.tutor.current_speaking = false;

      const hesitationConfig: CoachingConfig = {
        ...TEST_CONFIG,
        hesitationThresholdMs: 0, // treat any latency as hesitation for test speed
        hesitationCountThreshold: 3,
      };
      const hesEngine = createCoachingEngine((n) => nudges.push(n), hesitationConfig);

      // Simulate 3 hesitations: tutor stops → student speaks after a delay
      for (let round = 0; round < 3; round++) {
        // tutor speaking
        const tSpeaking = makeMetrics({ studentSpeaking: false });
        tSpeaking.metrics.tutor.current_speaking = true;
        hesEngine.evaluate(tSpeaking);

        // tutor stops (trigger tutorStoppedAtMs)
        const tStopped = makeMetrics({ studentSpeaking: false });
        tStopped.metrics.tutor.current_speaking = false;
        hesEngine.evaluate(tStopped);

        // student starts (latency ≥ 0 ms qualifies)
        const sStarts = makeMetrics({ studentSpeaking: true });
        sStarts.metrics.tutor.current_speaking = false;
        hesEngine.evaluate(sStarts);
      }

      expect(nudges.some((n) => n.type === "student_hesitating")).toBe(true);
    });

    it("does not fire when student responds quickly", () => {
      // With high threshold, normal responses won't count
      const quickConfig: CoachingConfig = {
        ...TEST_CONFIG,
        hesitationThresholdMs: 60_000, // 60s — impossible in test
        hesitationCountThreshold: 3,
      };
      const quickEngine = createCoachingEngine((n) => nudges.push(n), quickConfig);
      const m = makeMetrics({ studentSpeaking: true });
      for (let i = 0; i < 20; i++) quickEngine.evaluate(m);
      expect(nudges.some((n) => n.type === "student_hesitating")).toBe(false);
    });
  });

  describe("nudge event structure", () => {
    it("nudge has all required fields", () => {
      const m = makeMetrics({ tutorSpeaking: true, studentSpeaking: false });
      (m.metrics.tutor as Record<string, unknown>).tutor_monologue_sec = 95;
      engine.evaluate(m);
      const nudge = nudges[0];
      expect(nudge).toBeDefined();
      expect(nudge.id).toBeTruthy();
      expect(nudge.type).toBeTruthy();
      expect(nudge.headline).toBeTruthy();
      expect(nudge.suggestion).toBeTruthy();
      expect(nudge.timestamp).toBeTypeOf("number");
    });
  });
});

describe("validateMetrics", () => {
  it("validates correct metrics payload", () => {
    const payload = {
      timestamp: new Date().toISOString(),
      session_id: "test",
      metrics: {
        tutor: { eye_contact_score: 0.85, talk_time_percent: 0.65, current_speaking: true },
        student: { eye_contact_score: 0.78, talk_time_percent: 0.35, current_speaking: false },
      },
    };
    expect(validateMetrics(payload)).not.toBeNull();
  });

  it("rejects invalid payload", () => {
    expect(validateMetrics({ invalid: true })).toBeNull();
  });

  it("rejects scores out of range", () => {
    const payload = {
      timestamp: new Date().toISOString(),
      session_id: "test",
      metrics: {
        tutor: { eye_contact_score: 1.5, talk_time_percent: 0.5, current_speaking: true },
        student: { eye_contact_score: 0.5, talk_time_percent: 0.5, current_speaking: false },
      },
    };
    expect(validateMetrics(payload)).toBeNull();
  });
});
