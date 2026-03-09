import { describe, it, expect } from "vitest";
import { segmentAttention, detectDriftPattern } from "@analytics-dashboard/attention-cycles";
import type { SessionMetrics } from "@metrics-engine/metrics-schema";

function makeMetrics(tutorEye: number, studentEye: number): SessionMetrics {
  return {
    timestamp: new Date().toISOString(),
    session_id: "test",
    metrics: {
      tutor: {
        eye_contact_score: tutorEye,
        talk_time_percent: 0.5,
        current_speaking: true,
      },
      student: {
        eye_contact_score: studentEye,
        talk_time_percent: 0.5,
        current_speaking: false,
      },
    },
  };
}

describe("segmentAttention", () => {
  it("returns empty segments for empty history", () => {
    const result = segmentAttention([]);
    expect(result.segments).toHaveLength(0);
    expect(result.pattern).toBeNull();
  });

  it("divides 30 samples into 3 equal segments with labels Beginning/Middle/End", () => {
    const history: SessionMetrics[] = Array.from({ length: 30 }, (_, i) =>
      makeMetrics(0.8, i < 10 ? 0.9 : i < 20 ? 0.5 : 0.8)
    );

    const result = segmentAttention(history, 3);
    expect(result.segments).toHaveLength(3);
    expect(result.segments[0].label).toBe("Beginning");
    expect(result.segments[1].label).toBe("Middle");
    expect(result.segments[2].label).toBe("End");
  });

  it("computes per-segment averages correctly", () => {
    // 6 samples: 2 per segment
    // Segment 0: student eye 0.8, 0.8 → avg 0.8
    // Segment 1: student eye 0.4, 0.4 → avg 0.4
    // Segment 2: student eye 0.9, 0.9 → avg 0.9
    const history: SessionMetrics[] = [
      makeMetrics(0.7, 0.8),
      makeMetrics(0.7, 0.8),
      makeMetrics(0.7, 0.4),
      makeMetrics(0.7, 0.4),
      makeMetrics(0.7, 0.9),
      makeMetrics(0.7, 0.9),
    ];

    const result = segmentAttention(history, 3);
    expect(result.segments[0].studentEyeContact).toBe(0.8);
    expect(result.segments[1].studentEyeContact).toBe(0.4);
    expect(result.segments[2].studentEyeContact).toBe(0.9);
  });

  it("handles a single sample by returning 1 segment", () => {
    const history = [makeMetrics(0.7, 0.6)];
    const result = segmentAttention(history, 3);
    expect(result.segments).toHaveLength(1);
  });

  it("uses Segment N labels when actualSegments != 3", () => {
    const history: SessionMetrics[] = Array.from({ length: 4 }, () => makeMetrics(0.7, 0.6));
    const result = segmentAttention(history, 4);
    expect(result.segments[0].label).toBe("Segment 1");
  });
});

describe("detectDriftPattern", () => {
  it("detects middle drift when middle segment is much lower than boundaries", () => {
    const segments = [
      { label: "Beginning", startIndex: 0, endIndex: 9, tutorEyeContact: 0.8, studentEyeContact: 0.9 },
      { label: "Middle", startIndex: 10, endIndex: 19, tutorEyeContact: 0.8, studentEyeContact: 0.5 },
      { label: "End", startIndex: 20, endIndex: 29, tutorEyeContact: 0.8, studentEyeContact: 0.9 },
    ];
    const pattern = detectDriftPattern(segments);
    expect(pattern).toContain("middle");
  });

  it("detects progressive decline", () => {
    const segments = [
      { label: "Beginning", startIndex: 0, endIndex: 9, tutorEyeContact: 0.8, studentEyeContact: 0.9 },
      { label: "Middle", startIndex: 10, endIndex: 19, tutorEyeContact: 0.8, studentEyeContact: 0.6 },
      { label: "End", startIndex: 20, endIndex: 29, tutorEyeContact: 0.8, studentEyeContact: 0.3 },
    ];
    const pattern = detectDriftPattern(segments);
    // Drop from 0.9 to 0.3 = 0.6 > 0.25 and declining
    expect(pattern).toContain("declined progressively");
  });

  it("returns null when attention is uniform", () => {
    const segments = [
      { label: "Beginning", startIndex: 0, endIndex: 9, tutorEyeContact: 0.8, studentEyeContact: 0.7 },
      { label: "Middle", startIndex: 10, endIndex: 19, tutorEyeContact: 0.8, studentEyeContact: 0.7 },
      { label: "End", startIndex: 20, endIndex: 29, tutorEyeContact: 0.8, studentEyeContact: 0.7 },
    ];
    expect(detectDriftPattern(segments)).toBeNull();
  });

  it("returns null for fewer than 3 segments", () => {
    const segments = [
      { label: "Beginning", startIndex: 0, endIndex: 9, tutorEyeContact: 0.8, studentEyeContact: 0.9 },
      { label: "End", startIndex: 10, endIndex: 19, tutorEyeContact: 0.8, studentEyeContact: 0.3 },
    ];
    expect(detectDriftPattern(segments)).toBeNull();
  });
});
