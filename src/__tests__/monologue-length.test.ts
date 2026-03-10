import { describe, it, expect } from "vitest";
import { createMonologueTracker } from "@metrics-engine/audio/monologue-length";

describe("createMonologueTracker", () => {
  it("tracks current monologue when tutor speaks", () => {
    let now = 0;
    const clock = () => now;
    const tracker = createMonologueTracker(clock);

    tracker.onSpeechStart("tutor");
    now = 50_000; // 50 seconds later
    const stats = tracker.getStats(clock);
    expect(stats.currentMonologueMs).toBe(50_000);
    expect(stats.maxMonologueMs).toBe(0); // not recorded until turn ends
    expect(stats.lastMonologueMs).toBe(0);
  });

  it("records monologue duration when tutor stops", () => {
    let now = 0;
    const clock = () => now;
    const tracker = createMonologueTracker(clock);

    tracker.onSpeechStart("tutor");
    now = 95_000; // 95 seconds
    tracker.onSpeechEnd("tutor");

    const stats = tracker.getStats(clock);
    expect(stats.currentMonologueMs).toBe(0);
    expect(stats.lastMonologueMs).toBe(95_000);
    expect(stats.maxMonologueMs).toBe(95_000);
  });

  it("records monologue when student speaks (tutor turn ends)", () => {
    let now = 0;
    const clock = () => now;
    const tracker = createMonologueTracker(clock);

    tracker.onSpeechStart("tutor");
    now = 90_000; // 90 seconds
    tracker.onSpeechStart("student"); // student speaks — tutor turn ended

    const stats = tracker.getStats(clock);
    expect(stats.currentMonologueMs).toBe(0);
    expect(stats.lastMonologueMs).toBe(90_000);
    expect(stats.maxMonologueMs).toBe(90_000);
  });

  it("tracks max monologue across multiple turns", () => {
    let now = 0;
    const clock = () => now;
    const tracker = createMonologueTracker(clock);

    tracker.onSpeechStart("tutor");
    now = 30_000;
    tracker.onSpeechEnd("tutor"); // 30s

    tracker.onSpeechStart("tutor");
    now = 100_000; // 70s more
    tracker.onSpeechStart("student"); // 70s total for this turn

    const stats = tracker.getStats(clock);
    expect(stats.maxMonologueMs).toBe(70_000);
    expect(stats.lastMonologueMs).toBe(70_000);
  });

  it("resets on reset()", () => {
    let now = 0;
    const clock = () => now;
    const tracker = createMonologueTracker(clock);

    tracker.onSpeechStart("tutor");
    now = 60_000;
    tracker.onSpeechEnd("tutor");
    tracker.reset();

    const stats = tracker.getStats(clock);
    expect(stats.currentMonologueMs).toBe(0);
    expect(stats.maxMonologueMs).toBe(0);
    expect(stats.lastMonologueMs).toBe(0);
  });
});
