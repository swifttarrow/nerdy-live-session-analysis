import { describe, it, expect } from "vitest";
import {
  classifyParticipation,
  participationDescription,
} from "@analytics-dashboard/participation";

describe("classifyParticipation", () => {
  describe("Socratic preset (ideal 70%, σ=0.2)", () => {
    const preset = "socratic" as const;

    it("returns 'great' when within 0.5 std dev of 70% (60-80%)", () => {
      expect(classifyParticipation(0.60, preset)).toBe("great");
      expect(classifyParticipation(0.65, preset)).toBe("great");
      expect(classifyParticipation(0.70, preset)).toBe("great");
      expect(classifyParticipation(0.75, preset)).toBe("great");
      expect(classifyParticipation(0.79, preset)).toBe("great"); // 0.80 can hit fp boundary
    });

    it("returns 'good' when within 1 std dev of 70% (50-90%)", () => {
      expect(classifyParticipation(0.50, preset)).toBe("good");
      expect(classifyParticipation(0.55, preset)).toBe("good");
      expect(classifyParticipation(0.85, preset)).toBe("good");
      expect(classifyParticipation(0.89, preset)).toBe("good"); // 0.90 can hit fp boundary
    });

    it("returns 'needs_improvement' when outside 1 std dev", () => {
      expect(classifyParticipation(0.0, preset)).toBe("needs_improvement");
      expect(classifyParticipation(0.40, preset)).toBe("needs_improvement");
      expect(classifyParticipation(0.49, preset)).toBe("needs_improvement");
      expect(classifyParticipation(0.91, preset)).toBe("needs_improvement");
      expect(classifyParticipation(1.0, preset)).toBe("needs_improvement");
    });
  });

  describe("Practice preset (ideal 50%)", () => {
    const preset = "practice" as const;

    it("returns 'great' when within 0.5 std dev (40-60%)", () => {
      expect(classifyParticipation(0.40, preset)).toBe("great");
      expect(classifyParticipation(0.50, preset)).toBe("great");
      expect(classifyParticipation(0.60, preset)).toBe("great");
    });

    it("returns 'good' when within 1 std dev (30-70%)", () => {
      expect(classifyParticipation(0.30, preset)).toBe("good");
      expect(classifyParticipation(0.70, preset)).toBe("good");
    });

    it("returns 'needs_improvement' when outside 1 std dev", () => {
      expect(classifyParticipation(0.20, preset)).toBe("needs_improvement");
      expect(classifyParticipation(0.85, preset)).toBe("needs_improvement");
    });
  });

  describe("Lecture preset (ideal 30%)", () => {
    const preset = "lecture" as const;

    it("returns 'great' when within 0.5 std dev (20-40%)", () => {
      expect(classifyParticipation(0.21, preset)).toBe("great"); // 0.20 can hit fp boundary
      expect(classifyParticipation(0.30, preset)).toBe("great");
      expect(classifyParticipation(0.39, preset)).toBe("great"); // 0.40 can hit fp boundary
    });

    it("returns 'good' when within 1 std dev (10-50%)", () => {
      expect(classifyParticipation(0.10, preset)).toBe("good");
      expect(classifyParticipation(0.50, preset)).toBe("good");
    });

    it("returns 'needs_improvement' when outside 1 std dev", () => {
      expect(classifyParticipation(0.05, preset)).toBe("needs_improvement");
      expect(classifyParticipation(0.60, preset)).toBe("needs_improvement");
    });
  });

  describe("no preset (default 50% center)", () => {
    it("uses 50% as center when preset omitted", () => {
      expect(classifyParticipation(0.50)).toBe("great");
      expect(classifyParticipation(0.70)).toBe("good");
      expect(classifyParticipation(0.20)).toBe("needs_improvement");
    });
  });
});

describe("participationDescription", () => {
  it("returns a non-empty description for each label", () => {
    expect(participationDescription("great")).toContain("ideal");
    expect(participationDescription("good")).toContain("good");
    expect(participationDescription("needs_improvement")).toContain("ideal");
  });

  it("all descriptions are strings with meaningful length", () => {
    const labels = ["great", "good", "needs_improvement"] as const;
    for (const label of labels) {
      const desc = participationDescription(label);
      expect(desc.length).toBeGreaterThan(20);
    }
  });
});
