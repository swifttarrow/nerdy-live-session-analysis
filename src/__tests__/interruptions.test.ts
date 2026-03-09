import { describe, it, expect, vi } from "vitest";
import {
  createInterruptionTracker,
  detectOverlaps,
  type VadSegment,
} from "@/lib/audio/interruptions";
import {
  classifyInterruptions,
  classifyInterruptionsWithContent,
} from "@/lib/audio/interruption-classification";

// ---------------------------------------------------------------------------
// createInterruptionTracker — real-time tracker
// ---------------------------------------------------------------------------

describe("createInterruptionTracker", () => {
  it("detects student→tutor interruption when student starts while tutor is speaking", () => {
    const tracker = createInterruptionTracker();
    tracker.onSpeechStart("tutor");
    tracker.onSpeechStart("student"); // student starts while tutor is speaking
    const stats = tracker.getStats();
    expect(stats.studentToTutor).toBe(1);
    expect(stats.tutorToStudent).toBe(0);
    expect(stats.totalOverlaps).toBe(1);
  });

  it("detects tutor→student interruption when tutor starts while student is speaking", () => {
    const tracker = createInterruptionTracker();
    tracker.onSpeechStart("student");
    tracker.onSpeechStart("tutor"); // tutor starts while student is speaking
    const stats = tracker.getStats();
    expect(stats.tutorToStudent).toBe(1);
    expect(stats.studentToTutor).toBe(0);
    expect(stats.totalOverlaps).toBe(1);
  });

  it("records no interruption when one person speaks alone", () => {
    const tracker = createInterruptionTracker();
    tracker.onSpeechStart("tutor");
    tracker.onSpeechEnd("tutor");
    tracker.onSpeechStart("student");
    tracker.onSpeechEnd("student");
    const stats = tracker.getStats();
    expect(stats.totalOverlaps).toBe(0);
  });

  it("counts multiple interruptions", () => {
    const tracker = createInterruptionTracker();
    // 3 rounds of tutor→student
    for (let i = 0; i < 3; i++) {
      tracker.onSpeechStart("student");
      tracker.onSpeechStart("tutor"); // interruption
      tracker.onSpeechEnd("student");
      tracker.onSpeechEnd("tutor");
    }
    expect(tracker.getStats().tutorToStudent).toBe(3);
  });

  it("does not double-count if same role starts while already marked speaking", () => {
    const tracker = createInterruptionTracker();
    tracker.onSpeechStart("tutor");
    tracker.onSpeechStart("tutor"); // duplicate — should be ignored
    tracker.onSpeechStart("student");
    expect(tracker.getStats().studentToTutor).toBe(1);
  });

  it("resets state correctly", () => {
    const tracker = createInterruptionTracker();
    tracker.onSpeechStart("tutor");
    tracker.onSpeechStart("student");
    tracker.reset();
    expect(tracker.getStats().totalOverlaps).toBe(0);
    expect(tracker.getStats().events).toHaveLength(0);
  });

  it("calls onTutorInterruption callback when tutor interrupts student", () => {
    const callback = vi.fn();
    const tracker = createInterruptionTracker({ onTutorInterruption: callback });
    tracker.onSpeechStart("student");
    tracker.onSpeechStart("tutor");
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("does not call onTutorInterruption for student→tutor direction", () => {
    const callback = vi.fn();
    const tracker = createInterruptionTracker({ onTutorInterruption: callback });
    tracker.onSpeechStart("tutor");
    tracker.onSpeechStart("student");
    expect(callback).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// detectOverlaps — batch / post-session analysis
// ---------------------------------------------------------------------------

describe("detectOverlaps", () => {
  it("returns zero overlaps when segments do not overlap", () => {
    const tutor: VadSegment[] = [{ start: 0, end: 1000 }];
    const student: VadSegment[] = [{ start: 2000, end: 3000 }];
    const result = detectOverlaps(tutor, student);
    expect(result.totalOverlaps).toBe(0);
  });

  it("detects student→tutor when student starts within tutor segment", () => {
    const tutor: VadSegment[] = [{ start: 0, end: 2000 }];
    const student: VadSegment[] = [{ start: 500, end: 1500 }]; // starts while tutor speaking
    const result = detectOverlaps(tutor, student);
    expect(result.studentToTutor).toBe(1);
    expect(result.tutorToStudent).toBe(0);
  });

  it("detects tutor→student when tutor starts within student segment", () => {
    const student: VadSegment[] = [{ start: 0, end: 2000 }];
    const tutor: VadSegment[] = [{ start: 500, end: 1500 }]; // starts while student speaking
    const result = detectOverlaps([], []);
    // Empty case
    expect(result.totalOverlaps).toBe(0);

    const result2 = detectOverlaps(tutor, student);
    expect(result2.tutorToStudent).toBe(1);
    expect(result2.studentToTutor).toBe(0);
  });

  it("counts multiple overlaps correctly", () => {
    const tutor: VadSegment[] = [
      { start: 0, end: 1000 },
      { start: 2000, end: 3000 },
    ];
    const student: VadSegment[] = [
      { start: 500, end: 1500 },  // starts while tutor[0] speaking → student→tutor
      { start: 2500, end: 3500 }, // starts while tutor[1] speaking → student→tutor
    ];
    const result = detectOverlaps(tutor, student);
    expect(result.studentToTutor).toBe(2);
    expect(result.tutorToStudent).toBe(0);
    expect(result.totalOverlaps).toBe(2);
  });

  it("handles empty segments", () => {
    expect(detectOverlaps([], []).totalOverlaps).toBe(0);
    expect(detectOverlaps([{ start: 0, end: 1000 }], []).totalOverlaps).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// classifyInterruptions
// ---------------------------------------------------------------------------

describe("classifyInterruptions", () => {
  it("classifies student→tutor as productive", () => {
    const stats = {
      totalOverlaps: 3,
      studentToTutor: 3,
      tutorToStudent: 0,
      events: [],
    };
    const result = classifyInterruptions(stats);
    expect(result.productive).toBe(3);
    expect(result.unproductive).toBe(0);
    expect(result.neutral).toBe(0);
  });

  it("classifies tutor→student as neutral when below threshold", () => {
    const stats = {
      totalOverlaps: 3,
      studentToTutor: 0,
      tutorToStudent: 3,
      events: [],
    };
    const result = classifyInterruptions(stats, { unproductiveThreshold: 5 });
    expect(result.neutral).toBe(3);
    expect(result.unproductive).toBe(0);
  });

  it("classifies tutor→student as unproductive when above threshold", () => {
    const stats = {
      totalOverlaps: 7,
      studentToTutor: 0,
      tutorToStudent: 7,
      events: [],
    };
    const result = classifyInterruptions(stats, { unproductiveThreshold: 5 });
    expect(result.unproductive).toBe(7);
    expect(result.neutral).toBe(0);
  });

  it("handles mixed directions", () => {
    const stats = {
      totalOverlaps: 8,
      studentToTutor: 4,
      tutorToStudent: 4,
      events: [],
    };
    const result = classifyInterruptions(stats, { unproductiveThreshold: 3 });
    expect(result.productive).toBe(4);
    expect(result.unproductive).toBe(4);
    expect(result.neutral).toBe(0);
  });

  it("returns all zeros for empty stats", () => {
    const stats = { totalOverlaps: 0, studentToTutor: 0, tutorToStudent: 0, events: [] };
    const result = classifyInterruptions(stats);
    expect(result).toEqual({ productive: 0, unproductive: 0, neutral: 0 });
  });
});

// ---------------------------------------------------------------------------
// classifyInterruptionsWithContent (M29 Tier 2 integration)
// ---------------------------------------------------------------------------

describe("classifyInterruptionsWithContent", () => {
  it("falls back to Tier 1 when no transcripts provided", () => {
    const stats = {
      totalOverlaps: 4,
      studentToTutor: 4,
      tutorToStudent: 0,
      events: [
        { timestamp: 1000, direction: "student_to_tutor" as const },
        { timestamp: 2000, direction: "student_to_tutor" as const },
        { timestamp: 3000, direction: "student_to_tutor" as const },
        { timestamp: 4000, direction: "student_to_tutor" as const },
      ],
    };
    const result = classifyInterruptionsWithContent(stats);
    expect(result.productive).toBe(4);
    expect(result.neutral).toBe(0);
    expect(result.unproductive).toBe(0);
  });

  it("uses Tier 2 when transcripts provided and length matches events", () => {
    const stats = {
      totalOverlaps: 3,
      studentToTutor: 2,
      tutorToStudent: 1,
      events: [
        { timestamp: 1000, direction: "student_to_tutor" as const },
        { timestamp: 2000, direction: "student_to_tutor" as const },
        { timestamp: 3000, direction: "tutor_to_student" as const },
      ],
    };
    // "why does this work?" → clarifying, student_to_tutor → productive
    // "what do you mean?" → clarifying, student_to_tutor → productive
    // "by the way, did you see the game?" → off_topic → unproductive
    const transcripts = ["why does this work?", "what do you mean?", "by the way, did you see the game?"];
    const result = classifyInterruptionsWithContent(stats, transcripts);
    expect(result.productive).toBe(2);
    expect(result.unproductive).toBe(1);
    expect(result.neutral).toBe(0);
  });

  it("falls back to Tier 1 when transcript length does not match events", () => {
    const stats = {
      totalOverlaps: 2,
      studentToTutor: 2,
      tutorToStudent: 0,
      events: [
        { timestamp: 1000, direction: "student_to_tutor" as const },
        { timestamp: 2000, direction: "student_to_tutor" as const },
      ],
    };
    const transcripts = ["only one transcript"];
    const result = classifyInterruptionsWithContent(stats, transcripts);
    expect(result.productive).toBe(2);
    expect(result.neutral).toBe(0);
    expect(result.unproductive).toBe(0);
  });
});
