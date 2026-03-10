import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTalkTimeAggregator } from "@metrics-engine/audio/talk-time";

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

  it("rolling state computes ratio in window", () => {
    let now = 0;
    const clock = () => now;
    const agg = createTalkTimeAggregator(clock);

    agg.onSpeechStart("tutor");
    agg.onSpeechEnd("tutor", 2000); // tutor 2s
    agg.onSpeechStart("student");
    agg.onSpeechEnd("student", 1000); // student 1s

    const windowMs = 6000; // 6s window
    const rolling = agg.getRollingState(windowMs, 3000);
    expect(rolling.tutor.talkTimePercent).toBeCloseTo(2 / 3, 2);
    expect(rolling.student.talkTimePercent).toBeCloseTo(1 / 3, 2);
  });

  it("rolling state excludes segments outside window", () => {
    let now = 0;
    const clock = () => now;
    const agg = createTalkTimeAggregator(clock);

    agg.onSpeechStart("tutor");
    agg.onSpeechEnd("tutor", 5000); // tutor 5s at t=0
    now = 200_000; // 200s later
    agg.onSpeechStart("student");
    agg.onSpeechEnd("student", 2000); // student 2s at t=200s

    const windowMs = 10_000; // 10s window
    const rolling = agg.getRollingState(windowMs, 202_000);
    // Only student's 2s in window (tutor's 5s was 200s ago)
    expect(rolling.student.talkTimePercent).toBeCloseTo(1, 1);
    expect(rolling.tutor.talkTimePercent).toBeCloseTo(0, 1);
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
