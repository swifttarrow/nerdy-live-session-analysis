import { createVad } from "./vad";
import {
  createTalkTimeAggregator,
  TalkTimeState,
  DEFAULT_ROLLING_TALK_WINDOW_MS,
} from "./talk-time";
import type { ParticipantRole } from "./talk-time";
import type { InterruptionTracker } from "./interruptions";
import type { ResponseLatencyTracker } from "./response-latency";
import type { MonologueTracker } from "./monologue-length";
import { createTranscriptionCapturer } from "./transcription-capture";

export interface AudioPipelineOutput {
  talkTimePercent: number;
  speaking: boolean;
  /** Rolling-window talk ratio (2–5 min) for realtime nudge */
  talkTimePercentRolling?: number;
  /** Rolling state for both roles (when both tracks present) */
  rollingState?: { tutor: number; student: number };
  /** Tutor monologue length in seconds */
  tutorMonologueSec?: number;
  /** Tutor→student handoffs per minute in rolling window */
  tutorTurnsPerMinute?: number;
}

export interface AudioPipeline {
  /**
   * Add a MediaStream for a participant. Starts VAD and talk-time tracking.
   * onUpdate is called whenever speaking state changes.
   */
  addTrack(
    role: ParticipantRole,
    stream: MediaStream,
    onUpdate: (state: AudioPipelineOutput) => void
  ): void;
  getState(): Record<ParticipantRole, TalkTimeState>;
  destroy(): void;
}

export interface TranscriptionOptions {
  /** Called when a speech segment is ready for transcription (tutor only). */
  onTranscriptReady: (role: ParticipantRole, blob: Blob) => void;
}

/**
 * Create the audio analysis pipeline.
 * Connects each participant's MediaStream to VAD → talk-time aggregation.
 *
 * With LiveKit, each participant has a separate audio track, enabling
 * accurate per-person speaking detection without stereo diarization.
 *
 * @param interruptionTracker - optional; receives speech start/end events
 * @param responseLatencyTracker - optional M21 tracker; receives speech start/end events
 * @param monologueTracker - optional; tracks tutor monologue length
 * @param rollingTalkWindowMs - window for rolling talk ratio (default 3 min)
 * @param transcriptionOptions - optional; when provided, captures tutor speech for transcription
 */
export function createAudioPipeline(
  interruptionTracker?: InterruptionTracker | null,
  responseLatencyTracker?: ResponseLatencyTracker | null,
  monologueTracker?: MonologueTracker | null,
  rollingTalkWindowMs: number = DEFAULT_ROLLING_TALK_WINDOW_MS,
  transcriptionOptions?: TranscriptionOptions | null
): AudioPipeline {

  const aggregator = createTalkTimeAggregator();
  const vadInstances: Array<{ destroy(): void }> = [];
  const transcriptionCapturers = new Map<ParticipantRole, ReturnType<typeof createTranscriptionCapturer>>();
  const rolesWithTracks = new Set<ParticipantRole>();
  let sessionStartMs: number | null = null;

  function toOutput(
    state: { talkTimeMs: number; talkTimePercent: number; speaking: boolean },
    role: ParticipantRole
  ): AudioPipelineOutput {
    const base: AudioPipelineOutput = {
      talkTimePercent: state.talkTimePercent,
      speaking: state.speaking,
    };
    if (rolesWithTracks.size === 1 && sessionStartMs !== null) {
      const sessionDurationMs = Math.max(1, Date.now() - sessionStartMs);
      base.talkTimePercent = Math.min(1, state.talkTimeMs / sessionDurationMs);
    }
    if (rolesWithTracks.size >= 2) {
      const rolling = aggregator.getRollingState(rollingTalkWindowMs);
      base.talkTimePercentRolling = rolling[role].talkTimePercent;
      base.rollingState = {
        tutor: rolling.tutor.talkTimePercent,
        student: rolling.student.talkTimePercent,
      };
    }
    if (monologueTracker) {
      const stats = monologueTracker.getStats();
      // Only pass when tutor is currently speaking (for realtime nudge)
      base.tutorMonologueSec =
        stats.currentMonologueMs > 0 ? stats.currentMonologueMs / 1000 : undefined;
    }
    if (responseLatencyTracker) {
      const stats = responseLatencyTracker.getStats(
        undefined,
        rollingTalkWindowMs
      );
      base.tutorTurnsPerMinute = stats.turnsPerMinute ?? 0;
    }
    return base;
  }

  function onSpeechEvent(role: ParticipantRole) {
    aggregator.onSpeechStart(role);
    interruptionTracker?.onSpeechStart(role);
    responseLatencyTracker?.onSpeechStart(role);
    monologueTracker?.onSpeechStart(role);
  }

  function onSpeechEndEvent(role: ParticipantRole) {
    aggregator.onSpeechEnd(role);
    interruptionTracker?.onSpeechEnd(role);
    responseLatencyTracker?.onSpeechEnd(role);
    monologueTracker?.onSpeechEnd(role);
  }

  const trackCallbacks: Array<{
    role: ParticipantRole;
    onUpdate: (out: AudioPipelineOutput) => void;
  }> = [];
  let pollIntervalId: ReturnType<typeof setInterval> | null = null;

  function startPolling() {
    if (pollIntervalId) return;
    pollIntervalId = setInterval(() => {
      for (const { role, onUpdate } of trackCallbacks) {
        onUpdate(toOutput(aggregator.getState(role), role));
      }
    }, 1000);
  }

  return {
    addTrack(role, stream, onUpdate) {
      rolesWithTracks.add(role);
      if (sessionStartMs === null) sessionStartMs = Date.now();

      trackCallbacks.push({ role, onUpdate });

      // Set up transcription capture for tutor when requested
      if (transcriptionOptions && role === "tutor") {
        const capturer = createTranscriptionCapturer(stream);
        transcriptionCapturers.set(role, capturer);
      }

      void createVad(stream, {
        onSpeechStart: () => {
          transcriptionCapturers.get(role)?.start();
          onSpeechEvent(role);
          onUpdate(toOutput(aggregator.getState(role), role));
        },
        onSpeechEnd: () => {
          const blobPromise = transcriptionCapturers.get(role)?.stop();
          onSpeechEndEvent(role);
          onUpdate(toOutput(aggregator.getState(role), role));
          if (transcriptionOptions && blobPromise) {
            void blobPromise.then((blob) => {
              if (blob) transcriptionOptions.onTranscriptReady(role, blob);
            });
          }
        },
        onVADMisfire: () => {
          if (aggregator.getState(role).speaking) {
            transcriptionCapturers.get(role)?.stop();
            onSpeechEndEvent(role);
            onUpdate(toOutput(aggregator.getState(role), role));
          }
        },
      }).then((vad) => {
        if (vad) {
          vadInstances.push(vad);
          void vad.start();
        }
      });

      startPolling();
    },

    getState() {
      return aggregator.getAllState();
    },

    destroy() {
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
      }
      trackCallbacks.length = 0;
      for (const vad of vadInstances) {
        vad.destroy();
      }
      vadInstances.length = 0;
      for (const capturer of transcriptionCapturers.values()) {
        capturer.destroy();
      }
      transcriptionCapturers.clear();
    },
  };
}
