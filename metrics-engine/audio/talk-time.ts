/**
 * Talk-time aggregator: computes speaking percentages per participant.
 *
 * Per ONE_PAGER: student talk ratio is the primary engagement-quality signal.
 * Supports rolling window (2–5 min) for realtime nudges.
 */
export type ParticipantRole = "tutor" | "student";

export interface TalkTimeState {
  talkTimeMs: number;
  talkTimePercent: number;
  speaking: boolean;
}

export interface RollingTalkTimeState {
  tutor: TalkTimeState;
  student: TalkTimeState;
}

export interface TalkTimeAggregator {
  onSpeechStart(role: ParticipantRole): void;
  onSpeechEnd(role: ParticipantRole, durationMs?: number): void;
  getState(role: ParticipantRole): TalkTimeState;
  getAllState(): Record<ParticipantRole, TalkTimeState>;
  /** Rolling window state for realtime nudges (e.g. last 2–5 min) */
  getRollingState(windowMs: number, now?: number): RollingTalkTimeState;
  reset(): void;
}

interface SpeechSegment {
  startMs: number;
  endMs: number;
  role: ParticipantRole;
}

/** Default rolling window for realtime talk-ratio nudge (3 min) */
export const DEFAULT_ROLLING_TALK_WINDOW_MS = 180_000;

/**
 * Create a talk-time aggregator.
 * Tracks cumulative speaking time and rolling-window state.
 */
export function createTalkTimeAggregator(
  clock: () => number = Date.now
): TalkTimeAggregator {
  const speakingStart: Record<ParticipantRole, number | null> = {
    tutor: null,
    student: null,
  };
  const totalTalkMs: Record<ParticipantRole, number> = {
    tutor: 0,
    student: 0,
  };
  const currentlySpeaking: Record<ParticipantRole, boolean> = {
    tutor: false,
    student: false,
  };
  const segments: SpeechSegment[] = [];
  const MAX_SEGMENTS_AGE_MS = 600_000; // prune segments older than 10 min

  function totalMs(): number {
    const now = clock();
    const inProgressTutor = speakingStart.tutor !== null ? now - speakingStart.tutor! : 0;
    const inProgressStudent = speakingStart.student !== null ? now - speakingStart.student! : 0;
    const total = totalTalkMs.tutor + totalTalkMs.student + inProgressTutor + inProgressStudent;
    return total || 1; // avoid div/0 when no speech at all
  }

  function pruneOldSegments(now: number) {
    const cutoff = now - MAX_SEGMENTS_AGE_MS;
    while (segments.length > 0 && segments[0].endMs < cutoff) {
      segments.shift();
    }
  }

  return {
    onSpeechStart(role) {
      currentlySpeaking[role] = true;
      speakingStart[role] = clock();
    },

    onSpeechEnd(role, durationMs) {
      currentlySpeaking[role] = false;
      const start = speakingStart[role];
      const now = clock();
      let duration: number;
      if (durationMs !== undefined) {
        duration = durationMs;
      } else if (start !== null) {
        duration = now - start;
      } else {
        duration = 0;
      }
      if (start !== null && duration > 0) {
        segments.push({ startMs: start, endMs: start + duration, role });
      }
      if (duration > 0) {
        totalTalkMs[role] += duration;
      }
      speakingStart[role] = null;
      pruneOldSegments(now);
    },

    getState(role): TalkTimeState {
      const now = clock();
      const inProgress = speakingStart[role] !== null
        ? now - speakingStart[role]!
        : 0;
      const total = totalTalkMs[role] + inProgress;
      const percent = total / totalMs();

      return {
        talkTimeMs: total,
        talkTimePercent: Math.min(1, percent),
        speaking: currentlySpeaking[role],
      };
    },

    getAllState() {
      return {
        tutor: this.getState("tutor"),
        student: this.getState("student"),
      };
    },

    getRollingState(windowMs: number, now = clock()) {
      pruneOldSegments(now);
      const windowStart = now - windowMs;
      let tutorMs = 0;
      let studentMs = 0;

      for (const seg of segments) {
        if (seg.endMs <= windowStart) continue;
        const overlapStart = Math.max(seg.startMs, windowStart);
        const overlapEnd = Math.min(seg.endMs, now);
        const overlap = Math.max(0, overlapEnd - overlapStart);
        if (seg.role === "tutor") tutorMs += overlap;
        else studentMs += overlap;
      }

      // Add in-progress speech
      if (speakingStart.tutor !== null) {
        const start = Math.max(speakingStart.tutor, windowStart);
        tutorMs += now - start;
      }
      if (speakingStart.student !== null) {
        const start = Math.max(speakingStart.student, windowStart);
        studentMs += now - start;
      }

      const total = tutorMs + studentMs || 1;
      return {
        tutor: {
          talkTimeMs: tutorMs,
          talkTimePercent: Math.min(1, tutorMs / total),
          speaking: currentlySpeaking.tutor,
        },
        student: {
          talkTimeMs: studentMs,
          talkTimePercent: Math.min(1, studentMs / total),
          speaking: currentlySpeaking.student,
        },
      };
    },

    reset() {
      for (const role of ["tutor", "student"] as ParticipantRole[]) {
        speakingStart[role] = null;
        totalTalkMs[role] = 0;
        currentlySpeaking[role] = false;
      }
      segments.length = 0;
    },
  };
}
