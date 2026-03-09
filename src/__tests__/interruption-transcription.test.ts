import { describe, it, expect } from "vitest";
import {
  classifyOverlapContent,
  summarizeTier2Classifications,
  type Tier2Classification,
} from "@metrics-engine/audio/interruption-transcription";

describe("classifyOverlapContent", () => {
  it("classifies 'why does this work?' student→tutor as clarifying and productive", () => {
    const result = classifyOverlapContent("why does this work?", "student_to_tutor");
    expect(result.contentCategory).toBe("clarifying");
    expect(result.productivity).toBe("productive");
    expect(result.confidence).toBe("high");
  });

  it("classifies 'what do you mean by that?' student→tutor as clarifying and productive", () => {
    const result = classifyOverlapContent("what do you mean by that?", "student_to_tutor");
    expect(result.contentCategory).toBe("clarifying");
    expect(result.productivity).toBe("productive");
  });

  it("classifies 'wait let me think' tutor→student as procedural and neutral", () => {
    const result = classifyOverlapContent("wait let me think about this", "tutor_to_student");
    expect(result.contentCategory).toBe("procedural");
    expect(result.productivity).toBe("neutral");
    expect(result.confidence).toBe("high");
  });

  it("classifies 'by the way' as off_topic and unproductive", () => {
    const result = classifyOverlapContent("by the way, did you see the game?", "student_to_tutor");
    expect(result.contentCategory).toBe("off_topic");
    expect(result.productivity).toBe("unproductive");
    expect(result.confidence).toBe("high");
  });

  it("classifies 'never mind' as off_topic and unproductive", () => {
    const result = classifyOverlapContent("never mind, forget it", "tutor_to_student");
    expect(result.contentCategory).toBe("off_topic");
    expect(result.productivity).toBe("unproductive");
  });

  it("defaults clarifying for student_to_tutor when no keyword matches", () => {
    const result = classifyOverlapContent("something completely different xyz", "student_to_tutor");
    expect(result.contentCategory).toBe("clarifying");
    expect(result.confidence).toBe("low");
  });

  it("defaults procedural for tutor_to_student when no keyword matches", () => {
    const result = classifyOverlapContent("something completely different xyz", "tutor_to_student");
    expect(result.contentCategory).toBe("procedural");
    expect(result.confidence).toBe("low");
  });

  it("off_topic takes precedence over clarifying keywords", () => {
    // Has both "why" and "by the way"
    const result = classifyOverlapContent("by the way, why did you do that?", "student_to_tutor");
    expect(result.contentCategory).toBe("off_topic");
    expect(result.productivity).toBe("unproductive");
  });

  it("is case insensitive", () => {
    const result = classifyOverlapContent("WHY DOES THIS WORK?", "student_to_tutor");
    expect(result.contentCategory).toBe("clarifying");
  });

  it("clarifying student_to_tutor → productive; clarifying tutor_to_student → neutral", () => {
    const studentResult = classifyOverlapContent("how does this work?", "student_to_tutor");
    const tutorResult = classifyOverlapContent("how does this work?", "tutor_to_student");
    expect(studentResult.productivity).toBe("productive");
    expect(tutorResult.productivity).toBe("neutral");
  });
});

describe("summarizeTier2Classifications", () => {
  it("counts categories correctly", () => {
    const classifications: Tier2Classification[] = [
      { contentCategory: "clarifying", productivity: "productive", confidence: "high" },
      { contentCategory: "clarifying", productivity: "productive", confidence: "high" },
      { contentCategory: "procedural", productivity: "neutral", confidence: "low" },
      { contentCategory: "off_topic", productivity: "unproductive", confidence: "high" },
    ];

    const result = summarizeTier2Classifications(classifications);
    expect(result.clarifying).toBe(2);
    expect(result.procedural).toBe(1);
    expect(result.off_topic).toBe(1);
  });

  it("returns all zeros for empty array", () => {
    const result = summarizeTier2Classifications([]);
    expect(result.clarifying).toBe(0);
    expect(result.procedural).toBe(0);
    expect(result.off_topic).toBe(0);
  });
});
