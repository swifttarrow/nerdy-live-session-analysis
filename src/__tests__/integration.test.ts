/**
 * Integration tests: full coaching pipeline with mock session data.
 * Verifies triggers fire at expected times and report generates from session.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createCoachingEngine, NudgeEvent } from "@coaching-system/engine";
import { generateReport } from "@analytics-dashboard/report";
import { validateMetrics, type SessionMetrics } from "@metrics-engine/metrics-schema";
import { combineEnergyScores } from "@metrics-engine/energy/energy-level";
import { createDriftDetector } from "@video-processor/attention-drift";
import type { CoachingConfig } from "@coaching-system/config";

const FAST_CONFIG: CoachingConfig = {
  studentSilentSec: 3,
  tutorTalkThreshold: 0.8,
  eyeContactThreshold: 0.4,
  eyeContactDurationSec: 3,
  cooldownSec: 9999, // prevent cooldown from interfering with integration test
  interruptionSpikeThreshold: 2,
  interruptionSpikeWindowMs: 120_000,
  hesitationThresholdMs: 0,
  hesitationCountThreshold: 2,
  hesitationWindowMs: 120_000,
  studentTiredSec: 15,
  studentFrustratedSec: 12,
  studentDefeatedSec: 12,
  tutorMonologueThresholdSec: 90,
  turnTakingMinPerMinute: 0.5,
};

function makeMetrics(overrides: {
  tutorTalk?: number;
  studentTalk?: number;
  studentSpeaking?: boolean;
  tutorSpeaking?: boolean;
  tutorEyeContact?: number;
  studentEyeContact?: number;
  studentAttentionDrift?: boolean;
} = {}): SessionMetrics {
  return {
    timestamp: new Date().toISOString(),
    session_id: "integration-test",
    metrics: {
      tutor: {
        eye_contact_score: overrides.tutorEyeContact ?? 0.8,
        talk_time_percent: overrides.tutorTalk ?? 0.5,
        current_speaking: overrides.tutorSpeaking ?? true,
      },
      student: {
        eye_contact_score: overrides.studentEyeContact ?? 0.7,
        talk_time_percent: overrides.studentTalk ?? 0.5,
        current_speaking: overrides.studentSpeaking ?? true,
        ...(overrides.studentAttentionDrift !== undefined
          ? { attention_drift: overrides.studentAttentionDrift }
          : {}),
      },
    },
  };
}

describe("coaching pipeline integration", () => {
  let nudges: NudgeEvent[];
  let engine: ReturnType<typeof createCoachingEngine>;

  beforeEach(() => {
    nudges = [];
    engine = createCoachingEngine((n) => nudges.push(n), FAST_CONFIG);
  });

  it("fires student_silent after 3 seconds of silence in session", () => {
    const silentMetrics = makeMetrics({ studentSpeaking: false });
    for (let i = 0; i < 4; i++) engine.evaluate(silentMetrics);
    expect(nudges.some((n) => n.type === "student_silent")).toBe(true);
  });

  it("fires tutor_talk_dominant for unbalanced session", () => {
    const dominantMetrics = makeMetrics({ tutorTalk: 0.95, studentTalk: 0.05 });
    engine.evaluate(dominantMetrics);
    expect(nudges.some((n) => n.type === "tutor_talk_dominant")).toBe(true);
  });

  it("fires student_attention_drift when student attention_drift is true", () => {
    const driftMetrics = makeMetrics({ studentAttentionDrift: true });
    engine.evaluate(driftMetrics);
    expect(nudges.some((n) => n.type === "student_attention_drift")).toBe(true);
  });

  it("cooldowns respected across multi-trigger session", () => {
    const dominantMetrics = makeMetrics({ tutorTalk: 0.95 });
    // Evaluate 20 times — cooldown=9999s means first fire only
    for (let i = 0; i < 20; i++) engine.evaluate(dominantMetrics);
    const count = nudges.filter((n) => n.type === "tutor_talk_dominant").length;
    expect(count).toBe(1);
  });
});

describe("report generation from mock session", () => {
  it("generates report with engagement score for balanced session", () => {
    const balanced = makeMetrics({ tutorTalk: 0.5, studentTalk: 0.5, tutorEyeContact: 0.8, studentEyeContact: 0.75 });
    const history = Array(60).fill(balanced) as SessionMetrics[];
    const report = generateReport("integration-test", history);

    expect(report.sessionId).toBe("integration-test");
    expect(report.summary.sampleCount).toBe(60);
    expect(report.summary.engagementScore).toBeGreaterThanOrEqual(0);
    expect(report.summary.engagementScore).toBeLessThanOrEqual(1);
    expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it("low student talk produces high-priority recommendation", () => {
    const dominated = makeMetrics({ tutorTalk: 0.9, studentTalk: 0.1 });
    const history = Array(30).fill(dominated) as SessionMetrics[];
    const report = generateReport("dominated-session", history);

    const highPriority = report.recommendations.filter((r) => r.priority === "high");
    expect(highPriority.length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty session without crashing", () => {
    const report = generateReport("empty-session", []);
    expect(report.summary.sampleCount).toBe(0);
    expect(report.summary.engagementScore).toBe(0);
    expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});

describe("energy + drift integration with metrics schema", () => {
  it("energy pipeline produces valid metrics payload", () => {
    const voiceEnergy = 0.7;
    const expressionEnergy = 0.5;
    const energy = combineEnergyScores({ voiceEnergy, expressionEnergy });

    const detector = createDriftDetector({ driftThresholdSec: 5 });
    const drifting = detector.update(0.9); // not drifting

    const payload = {
      timestamp: new Date().toISOString(),
      session_id: "integration",
      metrics: {
        tutor: {
          eye_contact_score: 0.85,
          talk_time_percent: 0.6,
          current_speaking: true,
          energy_level: energy,
        },
        student: {
          eye_contact_score: 0.75,
          talk_time_percent: 0.4,
          current_speaking: false,
          attention_drift: drifting,
        },
      },
    };

    const validated = validateMetrics(payload);
    expect(validated).not.toBeNull();
    expect(validated?.metrics.tutor.energy_level).toBeCloseTo(energy, 2);
    expect(validated?.metrics.student.attention_drift).toBe(false);
  });
});
