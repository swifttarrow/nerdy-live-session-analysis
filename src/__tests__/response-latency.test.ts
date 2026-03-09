import { describe, it, expect } from "vitest";
import { createResponseLatencyTracker } from "@/lib/audio/response-latency";

describe("createResponseLatencyTracker", () => {
  it("computes latency correctly when student responds after tutor stops", () => {
    let now = 1000;
    const clock = () => now;
    const tracker = createResponseLatencyTracker(clock);

    tracker.onSpeechStart("tutor");
    tracker.onSpeechEnd("tutor"); // tutor stops at t=1000

    now = 2500; // 1500ms later
    tracker.onSpeechStart("student"); // student starts

    const stats = tracker.getStats();
    expect(stats.turnCount).toBe(1);
    expect(stats.avgResponseLatencyMs).toBe(1500);
    expect(stats.latencies).toEqual([1500]);
  });

  it("does not record latency if student speaks without prior tutor stop", () => {
    let now = 1000;
    const clock = () => now;
    const tracker = createResponseLatencyTracker(clock);

    // Student starts without tutor having stopped
    tracker.onSpeechStart("student");

    const stats = tracker.getStats();
    expect(stats.turnCount).toBe(0);
    expect(stats.avgResponseLatencyMs).toBe(0);
  });

  it("resets tutorStoppedAt when tutor starts speaking again", () => {
    let now = 1000;
    const clock = () => now;
    const tracker = createResponseLatencyTracker(clock);

    tracker.onSpeechEnd("tutor"); // tutor stops at 1000
    now = 1500;
    tracker.onSpeechStart("tutor"); // tutor starts again — resets pending stop
    now = 2000;
    tracker.onSpeechStart("student"); // student starts — no valid tutor stop pending

    const stats = tracker.getStats();
    expect(stats.turnCount).toBe(0);
  });

  it("tracks multiple turns and averages correctly", () => {
    let now = 0;
    const clock = () => now;
    const tracker = createResponseLatencyTracker(clock);

    // Turn 1: 1000ms latency
    tracker.onSpeechEnd("tutor");
    now = 1000;
    tracker.onSpeechStart("student");

    // Turn 2: 2000ms latency
    now = 2000;
    tracker.onSpeechEnd("tutor");
    now = 4000;
    tracker.onSpeechStart("student");

    const stats = tracker.getStats();
    expect(stats.turnCount).toBe(2);
    expect(stats.avgResponseLatencyMs).toBe(1500); // (1000 + 2000) / 2
  });

  it("counts hesitations correctly", () => {
    let now = 0;
    const clock = () => now;
    const tracker = createResponseLatencyTracker(clock);

    // Three turns: 1s, 4s, 6s latencies
    for (const latency of [1000, 4000, 6000]) {
      tracker.onSpeechEnd("tutor");
      now += latency;
      tracker.onSpeechStart("student");
      now += 1000; // student speaks for 1s
    }

    // Default hesitation threshold is 3000ms
    const stats = tracker.getStats(3000);
    expect(stats.hesitationCount).toBe(2); // 4000 and 6000 qualify
  });

  it("returns empty stats when no turns recorded", () => {
    const tracker = createResponseLatencyTracker();
    const stats = tracker.getStats();
    expect(stats.avgResponseLatencyMs).toBe(0);
    expect(stats.turnCount).toBe(0);
    expect(stats.hesitationCount).toBe(0);
    expect(stats.latencies).toEqual([]);
  });

  it("reset clears all state", () => {
    let now = 0;
    const clock = () => now;
    const tracker = createResponseLatencyTracker(clock);

    tracker.onSpeechEnd("tutor");
    now = 500;
    tracker.onSpeechStart("student");

    tracker.reset();
    const stats = tracker.getStats();
    expect(stats.turnCount).toBe(0);
  });

  it("does not record negative latency", () => {
    let now = 1000;
    const clock = () => now;
    const tracker = createResponseLatencyTracker(clock);

    tracker.onSpeechEnd("tutor");
    now = 500; // clock went backwards (shouldn't happen, but guard it)
    tracker.onSpeechStart("student");

    const stats = tracker.getStats();
    // Negative latency is filtered out
    expect(stats.turnCount).toBe(0);
  });
});
