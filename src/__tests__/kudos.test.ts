import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createKudosEngine,
  type KudosEvent,
  type KudosClassification,
} from "@coaching-system/kudos";

describe("createKudosEngine", () => {
  let kudos: KudosEvent[];
  let classifyFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    kudos = [];
    classifyFn = vi.fn();
  });

  function createEngine(
    preset: () => "socratic" | "lecture" | "practice" = () => "socratic"
  ) {
    return createKudosEngine(
      (k) => kudos.push(k),
      {
        preset,
        classifyKudosUrl: "/api/classify-kudos",
        classifyFn: classifyFn as (
          text: string
        ) => Promise<KudosClassification | null>,
      }
    );
  }

  describe("preset gating", () => {
    it("does not classify or fire when preset is not socratic", async () => {
      const engine = createEngine(() => "lecture");
      await engine.onTranscript("Why do you think that?");
      expect(classifyFn).not.toHaveBeenCalled();
      expect(kudos).toHaveLength(0);
    });

    it("classifies and fires when preset is socratic", async () => {
      classifyFn.mockResolvedValue({
        open_ended_question: true,
        hypothetical_scenario: false,
      });
      const engine = createEngine(() => "socratic");
      await engine.onTranscript("Why do you think that?");
      expect(classifyFn).toHaveBeenCalledWith("Why do you think that?");
      expect(kudos).toHaveLength(1);
      expect(kudos[0].type).toBe("open_ended_question");
    });
  });

  describe("short transcripts", () => {
    it("skips transcripts shorter than 5 chars", async () => {
      const engine = createEngine();
      await engine.onTranscript("Hi");
      expect(classifyFn).not.toHaveBeenCalled();
      expect(kudos).toHaveLength(0);
    });

    it("classifies transcripts of 5+ chars", async () => {
      classifyFn.mockResolvedValue({
        open_ended_question: true,
        hypothetical_scenario: false,
      });
      const engine = createEngine();
      await engine.onTranscript("Why so?");
      expect(classifyFn).toHaveBeenCalled();
      expect(kudos).toHaveLength(1);
    });
  });

  describe("open_ended_question kudos", () => {
    it("fires when classification returns open_ended_question true", async () => {
      classifyFn.mockResolvedValue({
        open_ended_question: true,
        hypothetical_scenario: false,
      });
      const engine = createEngine();
      await engine.onTranscript("Tell me more about that");
      expect(kudos).toHaveLength(1);
      expect(kudos[0].type).toBe("open_ended_question");
      expect(kudos[0].headline).toBe("Great probing question!");
    });

    it("does not fire when classification returns open_ended_question false", async () => {
      classifyFn.mockResolvedValue({
        open_ended_question: false,
        hypothetical_scenario: false,
      });
      const engine = createEngine();
      await engine.onTranscript("Is the answer 42?");
      expect(kudos).toHaveLength(0);
    });
  });

  describe("hypothetical_scenario kudos", () => {
    it("fires when classification returns hypothetical_scenario true", async () => {
      classifyFn.mockResolvedValue({
        open_ended_question: false,
        hypothetical_scenario: true,
      });
      const engine = createEngine();
      await engine.onTranscript("Consider a scenario where you doubled it");
      expect(kudos).toHaveLength(1);
      expect(kudos[0].type).toBe("hypothetical_scenario");
      expect(kudos[0].headline).toBe("Nice use of hypotheticals!");
    });

    it("does not fire when classification returns hypothetical_scenario false", async () => {
      classifyFn.mockResolvedValue({
        open_ended_question: false,
        hypothetical_scenario: false,
      });
      const engine = createEngine();
      await engine.onTranscript("Let's solve this problem");
      expect(kudos).toHaveLength(0);
    });
  });

  describe("one kudos per transcript", () => {
    it("fires only open_ended_question when both are true (prioritize first)", async () => {
      classifyFn.mockResolvedValue({
        open_ended_question: true,
        hypothetical_scenario: true,
      });
      const engine = createEngine();
      await engine.onTranscript("What if you think about why that works?");
      expect(kudos).toHaveLength(1);
      expect(kudos[0].type).toBe("open_ended_question");
    });
  });

  describe("cooldown", () => {
    it("fires only once per kudos type within cooldown window", async () => {
      classifyFn.mockResolvedValue({
        open_ended_question: true,
        hypothetical_scenario: false,
      });
      const engine = createEngine();
      vi.useFakeTimers();
      const baseTime = Date.now();
      vi.setSystemTime(baseTime);

      await engine.onTranscript("Why do you think that?");
      expect(kudos).toHaveLength(1);

      await engine.onTranscript("How would you approach it?");
      expect(kudos).toHaveLength(1); // Still 1, cooldown active

      vi.advanceTimersByTime(91_000);
      await engine.onTranscript("What makes you think that?");
      expect(kudos).toHaveLength(2);

      vi.useRealTimers();
    });
  });

  describe("classification failure", () => {
    it("does not fire when classifyFn returns null", async () => {
      classifyFn.mockResolvedValue(null);
      const engine = createEngine();
      await engine.onTranscript("Why do you think that?");
      expect(kudos).toHaveLength(0);
    });

    it("does not fire when classifyFn throws", async () => {
      classifyFn.mockRejectedValue(new Error("API error"));
      const engine = createEngine();
      await expect(
        engine.onTranscript("Why do you think that?")
      ).resolves.not.toThrow();
      expect(kudos).toHaveLength(0);
    });
  });
});
