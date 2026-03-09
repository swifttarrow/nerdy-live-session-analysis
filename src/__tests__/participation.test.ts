import { describe, it, expect } from "vitest";
import { classifyParticipation, participationDescription } from "@/lib/post-session/participation";

describe("classifyParticipation", () => {
  it("returns 'passive' when ratio is below passiveBelow threshold", () => {
    expect(classifyParticipation(0.1)).toBe("passive");
    expect(classifyParticipation(0.0)).toBe("passive");
    expect(classifyParticipation(0.19)).toBe("passive");
  });

  it("returns 'moderate' when ratio is between passive and engaged thresholds", () => {
    expect(classifyParticipation(0.2)).toBe("moderate");
    expect(classifyParticipation(0.3)).toBe("moderate");
    expect(classifyParticipation(0.39)).toBe("moderate");
  });

  it("returns 'engaged' when ratio is at or above engagedAbove threshold", () => {
    expect(classifyParticipation(0.4)).toBe("engaged");
    expect(classifyParticipation(0.5)).toBe("engaged");
    expect(classifyParticipation(1.0)).toBe("engaged");
  });

  it("respects custom thresholds", () => {
    const custom = { passiveBelow: 0.10, engagedAbove: 0.50 };
    expect(classifyParticipation(0.05, custom)).toBe("passive");
    expect(classifyParticipation(0.30, custom)).toBe("moderate");
    expect(classifyParticipation(0.60, custom)).toBe("engaged");
  });

  it("handles boundary values at passiveBelow", () => {
    // exactly at passiveBelow should be moderate (>= check is for engagedAbove)
    expect(classifyParticipation(0.20)).toBe("moderate");
  });
});

describe("participationDescription", () => {
  it("returns a non-empty description for each label", () => {
    expect(participationDescription("passive")).toContain("passive");
    expect(participationDescription("moderate")).toContain("moderate");
    expect(participationDescription("engaged")).toContain("engaged");
  });

  it("all descriptions are strings with meaningful length", () => {
    const labels = ["passive", "moderate", "engaged"] as const;
    for (const label of labels) {
      const desc = participationDescription(label);
      expect(desc.length).toBeGreaterThan(20);
    }
  });
});
