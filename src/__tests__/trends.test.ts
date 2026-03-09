import { describe, it, expect } from "vitest";
import { computeTrends } from "@/lib/post-session/trends";
import type { StoredSessionSummary } from "@/lib/session/session-store";

function makeSession(overrides: Partial<StoredSessionSummary> = {}): StoredSessionSummary {
  return {
    sessionId: `session-${Math.random()}`,
    storedAt: new Date().toISOString(),
    durationSec: 3600,
    avgTutorEyeContact: 0.7,
    avgStudentEyeContact: 0.6,
    avgTutorTalkPercent: 0.6,
    avgStudentTalkPercent: 0.4,
    studentTalkRatio: 0.4,
    engagementScore: 0.55,
    ...overrides,
  };
}

describe("computeTrends", () => {
  it("returns null when there are no prior sessions", () => {
    const current = makeSession({ sessionId: "current" });
    // History only contains current
    const result = computeTrends(current, [current]);
    expect(result).toBeNull();
  });

  it("returns null when history is empty", () => {
    const current = makeSession({ sessionId: "current" });
    const result = computeTrends(current, []);
    expect(result).toBeNull();
  });

  it("returns trends when prior sessions exist", () => {
    const current = makeSession({ sessionId: "current", engagementScore: 0.70 });
    const prior = makeSession({ sessionId: "prior-1", engagementScore: 0.55 });

    const result = computeTrends(current, [current, prior]);
    expect(result).not.toBeNull();
    expect(result!.sessionCount).toBe(2);
    expect(result!.trends).toHaveLength(4); // 4 metrics tracked
  });

  it("identifies improving direction when current is higher", () => {
    const current = makeSession({
      sessionId: "current",
      studentTalkRatio: 0.50,
      avgStudentEyeContact: 0.80,
      avgTutorEyeContact: 0.80,
      engagementScore: 0.75,
    });
    const prior = makeSession({
      sessionId: "prior-1",
      studentTalkRatio: 0.30,
      avgStudentEyeContact: 0.50,
      avgTutorEyeContact: 0.50,
      engagementScore: 0.45,
    });

    const result = computeTrends(current, [current, prior]);
    expect(result!.summary).toContain("Improving");
    const engagementTrend = result!.trends.find((t) => t.metric === "Engagement score");
    expect(engagementTrend!.direction).toBe("up");
  });

  it("identifies declining direction when current is lower", () => {
    const current = makeSession({
      sessionId: "current",
      studentTalkRatio: 0.20,
      avgStudentEyeContact: 0.30,
      avgTutorEyeContact: 0.40,
      engagementScore: 0.30,
    });
    const prior = makeSession({
      sessionId: "prior-1",
      studentTalkRatio: 0.50,
      avgStudentEyeContact: 0.70,
      avgTutorEyeContact: 0.70,
      engagementScore: 0.65,
    });

    const result = computeTrends(current, [current, prior]);
    expect(result!.summary).toContain("Declining");
  });

  it("computes changePercent correctly", () => {
    const current = makeSession({
      sessionId: "current",
      studentTalkRatio: 0.50,
    });
    const prior = makeSession({
      sessionId: "prior",
      studentTalkRatio: 0.40,
    });

    const result = computeTrends(current, [current, prior]);
    const talkTrend = result!.trends.find((t) => t.metric === "Student talk ratio");
    // (0.50 - 0.40) / 0.40 = 25%
    expect(talkTrend!.changePercent).toBe(25);
    expect(talkTrend!.direction).toBe("up");
  });

  it("uses stable direction when change is within threshold", () => {
    const current = makeSession({
      sessionId: "current",
      studentTalkRatio: 0.402, // tiny change
    });
    const prior = makeSession({
      sessionId: "prior",
      studentTalkRatio: 0.400,
    });

    const result = computeTrends(current, [current, prior]);
    const talkTrend = result!.trends.find((t) => t.metric === "Student talk ratio");
    expect(talkTrend!.direction).toBe("stable");
  });

  it("limits lookback to specified number of prior sessions", () => {
    const current = makeSession({ sessionId: "current", engagementScore: 0.70 });
    const priors = Array.from({ length: 5 }, (_, i) =>
      makeSession({ sessionId: `prior-${i}`, engagementScore: 0.40 })
    );
    const history = [current, ...priors];

    const result = computeTrends(current, history, 2);
    // Only the first 2 prior sessions are used
    expect(result!.sessionCount).toBe(3); // 2 prior + current
  });

  it("excludes current session from prior calculations", () => {
    const current = makeSession({ sessionId: "my-session", engagementScore: 0.70 });
    // History has current + 1 prior
    const prior = makeSession({ sessionId: "prior-session", engagementScore: 0.50 });
    const history = [current, prior];

    const result = computeTrends(current, history);
    // should only compare against prior, not current vs current
    const engTrend = result!.trends.find((t) => t.metric === "Engagement score");
    expect(engTrend!.previousAvg).toBeCloseTo(0.50);
  });
});
