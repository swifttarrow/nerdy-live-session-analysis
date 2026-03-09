/**
 * Talk-time aggregator: computes speaking percentages per participant.
 *
 * Per ONE_PAGER: student talk ratio is the primary engagement-quality signal.
 */
export type ParticipantRole = "tutor" | "student";

export interface TalkTimeState {
  talkTimeMs: number;
  talkTimePercent: number;
  speaking: boolean;
}

export interface TalkTimeAggregator {
  onSpeechStart(role: ParticipantRole): void;
  onSpeechEnd(role: ParticipantRole, durationMs?: number): void;
  getState(role: ParticipantRole): TalkTimeState;
  getAllState(): Record<ParticipantRole, TalkTimeState>;
  reset(): void;
}

/**
 * Create a talk-time aggregator.
 * Tracks cumulative speaking time for each participant.
 */
export function createTalkTimeAggregator(): TalkTimeAggregator {
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

  function totalMs(): number {
    return totalTalkMs.tutor + totalTalkMs.student || 1; // avoid div/0
  }

  return {
    onSpeechStart(role) {
      currentlySpeaking[role] = true;
      speakingStart[role] = Date.now();
    },

    onSpeechEnd(role, durationMs) {
      currentlySpeaking[role] = false;
      const start = speakingStart[role];
      if (durationMs !== undefined) {
        totalTalkMs[role] += durationMs;
      } else if (start !== null) {
        totalTalkMs[role] += Date.now() - start;
      }
      speakingStart[role] = null;
    },

    getState(role): TalkTimeState {
      // Add any in-progress speaking
      const inProgress = speakingStart[role] !== null
        ? Date.now() - speakingStart[role]!
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

    reset() {
      for (const role of ["tutor", "student"] as ParticipantRole[]) {
        speakingStart[role] = null;
        totalTalkMs[role] = 0;
        currentlySpeaking[role] = false;
      }
    },
  };
}
