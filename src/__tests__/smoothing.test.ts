import { describe, it, expect } from "vitest";
import { createEmaSmoother } from "@/lib/video/smoothing";

describe("createEmaSmoother", () => {
  it("initializes with first value on first update", () => {
    const s = createEmaSmoother({ alpha: 0.3 });
    expect(s.update(0.8)).toBe(0.8);
  });

  it("applies EMA formula", () => {
    const s = createEmaSmoother({ alpha: 0.5 });
    s.update(1.0); // state = 1.0
    const result = s.update(0.0); // 0.5 * 0 + 0.5 * 1 = 0.5
    expect(result).toBeCloseTo(0.5);
  });

  it("has reduced variance vs raw input", () => {
    const s = createEmaSmoother({ alpha: 0.2 });
    const raw = [1, 0, 1, 0, 1, 0, 1, 0];
    const smoothed = raw.map((v) => s.update(v));

    const rawVariance = variance(raw);
    const smoothedVariance = variance(smoothed);
    expect(smoothedVariance).toBeLessThan(rawVariance);
  });

  it("returns 0 for null when no previous state", () => {
    const s = createEmaSmoother();
    expect(s.update(null)).toBe(0);
  });

  it("returns last value when null and missingStrategy=last", () => {
    const s = createEmaSmoother({ alpha: 0.3, missingStrategy: "last" });
    s.update(0.7);
    expect(s.update(null)).toBeCloseTo(0.7);
  });

  it("trends toward zero when null and missingStrategy=zero", () => {
    const s = createEmaSmoother({ alpha: 0.5, missingStrategy: "zero" });
    s.update(1.0);
    const v1 = s.update(null); // 0.5 * 0 + 0.5 * 1 = 0.5
    const v2 = s.update(null); // 0.5 * 0 + 0.5 * 0.5 = 0.25
    expect(v1).toBeCloseTo(0.5);
    expect(v2).toBeCloseTo(0.25);
  });

  it("resets state", () => {
    const s = createEmaSmoother({ alpha: 0.3 });
    s.update(0.9);
    s.reset();
    expect(s.current()).toBe(0);
    expect(s.update(0.5)).toBe(0.5); // first update after reset
  });
});

function variance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
}
