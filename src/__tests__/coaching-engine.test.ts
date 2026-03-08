import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCoachingEngine, NudgeEvent } from "@/lib/coaching/engine";
import { validateMetrics, SessionMetrics } from "@/lib/session/metrics-schema";
import type { CoachingConfig } from "@/lib/coaching/config";

const TEST_CONFIG: CoachingConfig = {
  studentSilentSec: 5,        // 5s for test speed
  tutorTalkThreshold: 0.85,
  eyeContactThreshold: 0.5,
  eyeContactDurationSec: 3,   // 3s for test speed
  cooldownSec: 60,
};

function makeMetrics(overrides: {
  tutorTalk?: number;
  studentTalk?: number;
  studentSpeaking?: boolean;
  tutorEyeContact?: number;
  studentEyeContact?: number;
} = {}): SessionMetrics {
  return {
    timestamp: new Date().toISOString(),
    session_id: "test-session",
    metrics: {
      tutor: {
        eye_contact_score: overrides.tutorEyeContact ?? 0.8,
        talk_time_percent: overrides.tutorTalk ?? 0.5,
        current_speaking: true,
      },
      student: {
        eye_contact_score: overrides.studentEyeContact ?? 0.75,
        talk_time_percent: overrides.studentTalk ?? 0.5,
        current_speaking: overrides.studentSpeaking ?? true,
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

  describe("tutor_talk_dominant trigger", () => {
    it("fires when tutor talk time exceeds threshold", () => {
      const m = makeMetrics({ tutorTalk: 0.90, studentTalk: 0.10 });
      engine.evaluate(m);
      expect(nudges.some((n) => n.type === "tutor_talk_dominant")).toBe(true);
    });

    it("does not fire when tutor talk is below threshold", () => {
      const m = makeMetrics({ tutorTalk: 0.60, studentTalk: 0.40 });
      engine.evaluate(m);
      expect(nudges.some((n) => n.type === "tutor_talk_dominant")).toBe(false);
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

  describe("cooldown", () => {
    it("does not fire same trigger twice within cooldown period", () => {
      const shortCooldownConfig: CoachingConfig = {
        ...TEST_CONFIG,
        cooldownSec: 9999, // effectively never
      };
      const e2 = createCoachingEngine((n) => nudges.push(n), shortCooldownConfig);
      const m = makeMetrics({ tutorTalk: 0.90 });
      // Evaluate many times
      for (let i = 0; i < 20; i++) e2.evaluate(m);
      const count = nudges.filter((n) => n.type === "tutor_talk_dominant").length;
      expect(count).toBe(1); // fired exactly once due to cooldown
    });
  });

  describe("nudge event structure", () => {
    it("nudge has all required fields", () => {
      const m = makeMetrics({ tutorTalk: 0.90 });
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
