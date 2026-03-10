import { describe, it, expect } from "vitest";
import { aggregateSessionSummary } from "@analytics-dashboard/summary";
import { generateRecommendations } from "@analytics-dashboard/recommendations";
import { generateReport } from "@analytics-dashboard/report";
import type { SessionMetrics } from "@metrics-engine/metrics-schema";

function makeMetrics(
  tutorEye: number,
  studentEye: number,
  tutorTalk: number,
  studentTalk: number,
  studentSpeaking = true
): SessionMetrics {
  return {
    timestamp: new Date().toISOString(),
    session_id: "test",
    metrics: {
      tutor: {
        eye_contact_score: tutorEye,
        talk_time_percent: tutorTalk,
        current_speaking: true,
      },
      student: {
        eye_contact_score: studentEye,
        talk_time_percent: studentTalk,
        current_speaking: studentSpeaking,
      },
    },
  };
}

function repeat(m: SessionMetrics, n: number): SessionMetrics[] {
  return Array(n).fill(m);
}

describe("aggregateSessionSummary", () => {
  it("handles empty history", () => {
    const s = aggregateSessionSummary("test", []);
    expect(s.sampleCount).toBe(0);
    expect(s.engagementScore).toBe(0);
    expect(s.studentTalkRatio).toBe(0);
  });

  it("averages metrics correctly", () => {
    const m = makeMetrics(0.8, 0.6, 0.7, 0.3);
    const s = aggregateSessionSummary("test", repeat(m, 10));
    expect(s.avgTutorEyeContact).toBeCloseTo(0.8, 3);
    expect(s.avgStudentEyeContact).toBeCloseTo(0.6, 3);
    expect(s.avgTutorTalkPercent).toBeCloseTo(0.7, 3);
    expect(s.avgStudentTalkPercent).toBeCloseTo(0.3, 3);
  });

  it("computes student talk ratio", () => {
    // tutor=0.75, student=0.25 → ratio = 0.25/(0.75+0.25) = 0.25
    const m = makeMetrics(0.8, 0.6, 0.75, 0.25);
    const s = aggregateSessionSummary("test", repeat(m, 5));
    expect(s.studentTalkRatio).toBeCloseTo(0.25, 3);
  });

  it("engagement score is in [0, 1]", () => {
    const m = makeMetrics(0.9, 0.8, 0.6, 0.4);
    const s = aggregateSessionSummary("test", repeat(m, 20));
    expect(s.engagementScore).toBeGreaterThanOrEqual(0);
    expect(s.engagementScore).toBeLessThanOrEqual(1);
  });

  it("session duration equals sample count", () => {
    const m = makeMetrics(0.8, 0.7, 0.6, 0.4);
    const s = aggregateSessionSummary("test", repeat(m, 120));
    expect(s.durationSec).toBe(120);
    expect(s.sampleCount).toBe(120);
  });

  it("Gaussian: at center scores higher than far from center (socratic, 70% ideal)", () => {
    const eye = 0.8;
    const at70 = aggregateSessionSummary("test", repeat(makeMetrics(eye, eye, 0.3, 0.7), 10), {
      preset: "socratic",
    });
    const at100 = aggregateSessionSummary("test", repeat(makeMetrics(eye, eye, 0, 1), 10), {
      preset: "socratic",
    });
    expect(at70.engagementScore).toBeGreaterThan(at100.engagementScore);
  });

  it("preset centers differ: 30% ideal for lecture, 70% for socratic", () => {
    const m30 = makeMetrics(0.8, 0.8, 0.7, 0.3);
    const m70 = makeMetrics(0.8, 0.8, 0.3, 0.7);
    const lectureAt30 = aggregateSessionSummary("test", repeat(m30, 10), { preset: "lecture" });
    const lectureAt70 = aggregateSessionSummary("test", repeat(m70, 10), { preset: "lecture" });
    const socraticAt30 = aggregateSessionSummary("test", repeat(m30, 10), { preset: "socratic" });
    const socraticAt70 = aggregateSessionSummary("test", repeat(m70, 10), { preset: "socratic" });
    expect(lectureAt30.engagementScore).toBeGreaterThan(lectureAt70.engagementScore);
    expect(socraticAt70.engagementScore).toBeGreaterThan(socraticAt30.engagementScore);
  });
});

describe("generateRecommendations", () => {
  it("always returns at least one recommendation", () => {
    const s = aggregateSessionSummary("test", repeat(makeMetrics(0.8, 0.7, 0.5, 0.5), 10));
    const recs = generateRecommendations(s);
    expect(recs.length).toBeGreaterThanOrEqual(1);
  });

  it("low student talk → recommendation mentions questions", () => {
    // Student speaks only 10%
    const m = makeMetrics(0.8, 0.7, 0.9, 0.1);
    const s = aggregateSessionSummary("test", repeat(m, 10));
    const recs = generateRecommendations(s);
    const talkRec = recs.find((r) => r.category === "talk_balance");
    expect(talkRec).toBeDefined();
    expect(talkRec!.priority).toBe("high");
    expect(talkRec!.text.toLowerCase()).toContain("question");
  });

  it("good engagement → positive recommendation", () => {
    const m = makeMetrics(0.85, 0.80, 0.5, 0.5);
    const s = aggregateSessionSummary("test", repeat(m, 10));
    const recs = generateRecommendations(s);
    const engRec = recs.find((r) => r.category === "engagement");
    // Either no engagement rec (good) or positive
    if (engRec) {
      expect(engRec.priority).toBe("low");
    }
  });

  it("low eye contact → eye contact recommendation", () => {
    const m = makeMetrics(0.9, 0.2, 0.5, 0.5); // student low eye contact
    const s = aggregateSessionSummary("test", repeat(m, 10));
    const recs = generateRecommendations(s);
    const eyeRec = recs.find((r) => r.category === "eye_contact");
    expect(eyeRec).toBeDefined();
  });
});

describe("generateReport", () => {
  it("contains all expected fields", () => {
    const history = repeat(makeMetrics(0.8, 0.7, 0.6, 0.4), 30);
    const report = generateReport("session-123", history);

    expect(report.sessionId).toBe("session-123");
    expect(report.generatedAt).toBeTruthy();
    expect(report.summary).toBeDefined();
    expect(report.recommendations).toBeDefined();
    expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it("includes ≥1 recommendation", () => {
    const report = generateReport("s1", repeat(makeMetrics(0.5, 0.5, 0.9, 0.1), 20));
    expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it("handles empty history gracefully", () => {
    const report = generateReport("s2", []);
    expect(report.summary.sampleCount).toBe(0);
    expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it("recommendation is relevant to metrics (low student talk → questions)", () => {
    const report = generateReport("s3", repeat(makeMetrics(0.8, 0.7, 0.95, 0.05), 20));
    const hasQuestionRec = report.recommendations.some((r) =>
      r.text.toLowerCase().includes("question")
    );
    expect(hasQuestionRec).toBe(true);
  });
});
