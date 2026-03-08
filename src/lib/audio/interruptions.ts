/**
 * Interruption detection: tracks speaking overlaps between tutor and student.
 *
 * An interruption occurs when one participant starts speaking while the other
 * is already speaking. Direction is determined by who was speaking first:
 * - student starts while tutor is speaking → student_to_tutor
 * - tutor starts while student is speaking → tutor_to_student
 */

export type InterruptionRole = "tutor" | "student";

export interface InterruptionEvent {
  timestamp: number;
  direction: "student_to_tutor" | "tutor_to_student";
}

export interface InterruptionStats {
  totalOverlaps: number;
  /** Student interrupted tutor — typically signals engagement */
  studentToTutor: number;
  /** Tutor interrupted student */
  tutorToStudent: number;
  events: InterruptionEvent[];
}

export interface InterruptionTracker {
  onSpeechStart(role: InterruptionRole): void;
  onSpeechEnd(role: InterruptionRole): void;
  getStats(): InterruptionStats;
  reset(): void;
}

export interface InterruptionTrackerOptions {
  /** Called whenever a tutor→student interruption is detected (for M10 spike trigger) */
  onTutorInterruption?: () => void;
}

/**
 * Create a real-time interruption tracker driven by VAD speech-start/end events.
 */
export function createInterruptionTracker(
  options: InterruptionTrackerOptions = {}
): InterruptionTracker {
  const isSpeaking: Record<InterruptionRole, boolean> = {
    tutor: false,
    student: false,
  };
  const events: InterruptionEvent[] = [];

  return {
    onSpeechStart(role: InterruptionRole): void {
      if (isSpeaking[role]) return;
      const other: InterruptionRole = role === "tutor" ? "student" : "tutor";
      if (isSpeaking[other]) {
        const direction: InterruptionEvent["direction"] =
          role === "student" ? "student_to_tutor" : "tutor_to_student";
        events.push({ timestamp: Date.now(), direction });
        if (direction === "tutor_to_student") {
          options.onTutorInterruption?.();
        }
      }
      isSpeaking[role] = true;
    },

    onSpeechEnd(role: InterruptionRole): void {
      isSpeaking[role] = false;
    },

    getStats(): InterruptionStats {
      const studentToTutor = events.filter(
        (e) => e.direction === "student_to_tutor"
      ).length;
      const tutorToStudent = events.filter(
        (e) => e.direction === "tutor_to_student"
      ).length;
      return {
        totalOverlaps: events.length,
        studentToTutor,
        tutorToStudent,
        events: [...events],
      };
    },

    reset(): void {
      events.length = 0;
      isSpeaking.tutor = false;
      isSpeaking.student = false;
    },
  };
}

// ---------------------------------------------------------------------------
// Batch analysis (for unit tests and post-session processing)
// ---------------------------------------------------------------------------

export interface VadSegment {
  start: number; // ms
  end: number; // ms
}

/**
 * Detect overlaps from two sequences of VAD segments (tutor and student).
 * Returns overlap counts with directional attribution.
 * Uses a sweep-line approach over the event timeline.
 */
export function detectOverlaps(
  tutorSegments: VadSegment[],
  studentSegments: VadSegment[]
): { totalOverlaps: number; studentToTutor: number; tutorToStudent: number } {
  type TimelineEvent = {
    time: number;
    role: InterruptionRole;
    type: "start" | "end";
  };

  const timeline: TimelineEvent[] = [];

  for (const seg of tutorSegments) {
    timeline.push({ time: seg.start, role: "tutor", type: "start" });
    timeline.push({ time: seg.end, role: "tutor", type: "end" });
  }
  for (const seg of studentSegments) {
    timeline.push({ time: seg.start, role: "student", type: "start" });
    timeline.push({ time: seg.end, role: "student", type: "end" });
  }

  // Sort: end events before start events at the same time to avoid false overlaps
  timeline.sort(
    (a, b) => a.time - b.time || (a.type === "end" ? -1 : 1)
  );

  const isSpeaking: Record<InterruptionRole, boolean> = {
    tutor: false,
    student: false,
  };
  let studentToTutor = 0;
  let tutorToStudent = 0;

  for (const ev of timeline) {
    if (ev.type === "start") {
      const other: InterruptionRole = ev.role === "tutor" ? "student" : "tutor";
      if (isSpeaking[other]) {
        if (ev.role === "student") studentToTutor++;
        else tutorToStudent++;
      }
      isSpeaking[ev.role] = true;
    } else {
      isSpeaking[ev.role] = false;
    }
  }

  return {
    totalOverlaps: studentToTutor + tutorToStudent,
    studentToTutor,
    tutorToStudent,
  };
}
