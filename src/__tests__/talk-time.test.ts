import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTalkTimeAggregator } from "@/lib/audio/talk-time";

describe("createTalkTimeAggregator", () => {
  let agg: ReturnType<typeof createTalkTimeAggregator>;

  beforeEach(() => {
    agg = createTalkTimeAggregator();
  });

  it("starts with zero talk time", () => {
    const state = agg.getState("tutor");
    expect(state.talkTimeMs).toBe(0);
    expect(state.talkTimePercent).toBe(0);
    expect(state.speaking).toBe(false);
  });

  it("tracks speaking state", () => {
    agg.onSpeechStart("tutor");
    expect(agg.getState("tutor").speaking).toBe(true);
    agg.onSpeechEnd("tutor");
    expect(agg.getState("tutor").speaking).toBe(false);
  });

  it("accumulates talk time from explicit duration", () => {
    agg.onSpeechStart("tutor");
    agg.onSpeechEnd("tutor", 1000); // 1 second
    agg.onSpeechStart("tutor");
    agg.onSpeechEnd("tutor", 500); // 0.5 second
    const state = agg.getState("tutor");
    expect(state.talkTimeMs).toBe(1500);
  });

  it("computes correct talk-time percentages for tutor/student", () => {
    // Tutor speaks 3s, student speaks 1s → 75%/25%
    agg.onSpeechStart("tutor");
    agg.onSpeechEnd("tutor", 3000);
    agg.onSpeechStart("student");
    agg.onSpeechEnd("student", 1000);

    const tutorState = agg.getState("tutor");
    const studentState = agg.getState("student");

    expect(tutorState.talkTimePercent).toBeCloseTo(0.75, 2);
    expect(studentState.talkTimePercent).toBeCloseTo(0.25, 2);
  });

  it("talk-time percentages sum to 1.0 (approximately)", () => {
    agg.onSpeechStart("tutor");
    agg.onSpeechEnd("tutor", 2000);
    agg.onSpeechStart("student");
    agg.onSpeechEnd("student", 2000);

    const all = agg.getAllState();
    const sum = all.tutor.talkTimePercent + all.student.talkTimePercent;
    expect(sum).toBeCloseTo(1.0, 1);
  });

  it("handles no audio gracefully (zero division)", () => {
    const state = agg.getState("student");
    expect(state.talkTimePercent).toBe(0);
    expect(() => agg.getState("student")).not.toThrow();
  });

  it("resets to zero", () => {
    agg.onSpeechStart("tutor");
    agg.onSpeechEnd("tutor", 5000);
    agg.reset();
    expect(agg.getState("tutor").talkTimeMs).toBe(0);
    expect(agg.getState("tutor").talkTimePercent).toBe(0);
  });

  it("VAD segments → expected talk-time range", () => {
    // Simulate: tutor speaks 6 × 500ms = 3000ms; student speaks 4 × 500ms = 2000ms
    for (let i = 0; i < 6; i++) {
      agg.onSpeechStart("tutor");
      agg.onSpeechEnd("tutor", 500);
    }
    for (let i = 0; i < 4; i++) {
      agg.onSpeechStart("student");
      agg.onSpeechEnd("student", 500);
    }

    const all = agg.getAllState();
    expect(all.tutor.talkTimePercent).toBeGreaterThan(0.5);
    expect(all.student.talkTimePercent).toBeLessThan(0.5);
    expect(all.tutor.talkTimePercent + all.student.talkTimePercent).toBeCloseTo(1.0, 1);
  });
});
