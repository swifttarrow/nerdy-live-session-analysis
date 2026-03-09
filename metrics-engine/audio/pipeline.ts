import { createVad } from "./vad";
import { createTalkTimeAggregator, TalkTimeState } from "./talk-time";
import type { ParticipantRole } from "./talk-time";
import type { InterruptionTracker } from "./interruptions";
import type { ResponseLatencyTracker } from "./response-latency";

export interface AudioPipelineOutput {
  talkTimePercent: number;
  speaking: boolean;
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

/**
 * Create the audio analysis pipeline.
 * Connects each participant's MediaStream to VAD → talk-time aggregation.
 *
 * With LiveKit, each participant has a separate audio track, enabling
 * accurate per-person speaking detection without stereo diarization.
 *
 * @param interruptionTracker - optional tracker; receives speech start/end events
 * @param responseLatencyTracker - optional M21 tracker; receives speech start/end events
 */
export function createAudioPipeline(
  interruptionTracker?: InterruptionTracker | null,
  responseLatencyTracker?: ResponseLatencyTracker | null
): AudioPipeline {
  const aggregator = createTalkTimeAggregator();
  const vadInstances: Array<{ destroy(): void }> = [];
  const rolesWithTracks = new Set<ParticipantRole>();
  let sessionStartMs: number | null = null;

  function toOutput(state: { talkTimeMs: number; talkTimePercent: number; speaking: boolean }, _role: ParticipantRole): AudioPipelineOutput {
    if (rolesWithTracks.size === 1 && sessionStartMs !== null) {
      const sessionDurationMs = Math.max(1, Date.now() - sessionStartMs);
      const percent = Math.min(1, state.talkTimeMs / sessionDurationMs);
      return { talkTimePercent: percent, speaking: state.speaking };
    }
    return { talkTimePercent: state.talkTimePercent, speaking: state.speaking };
  }

  return {
    addTrack(role, stream, onUpdate) {
      rolesWithTracks.add(role);
      if (sessionStartMs === null) sessionStartMs = Date.now();

      void createVad(stream, {
        onSpeechStart: () => {
          aggregator.onSpeechStart(role);
          interruptionTracker?.onSpeechStart(role);
          responseLatencyTracker?.onSpeechStart(role);
          onUpdate(toOutput(aggregator.getState(role), role));
        },
        onSpeechEnd: (_audio) => {
          aggregator.onSpeechEnd(role);
          interruptionTracker?.onSpeechEnd(role);
          responseLatencyTracker?.onSpeechEnd(role);
          onUpdate(toOutput(aggregator.getState(role), role));
        },
        onVADMisfire: () => {
          // Misfire: treat as silence
          if (aggregator.getState(role).speaking) {
            aggregator.onSpeechEnd(role);
            interruptionTracker?.onSpeechEnd(role);
            responseLatencyTracker?.onSpeechEnd(role);
            onUpdate(toOutput(aggregator.getState(role), role));
          }
        },
      }).then((vad) => {
        if (vad) {
          vadInstances.push(vad);
          void vad.start();
        }
      });
    },

    getState() {
      return aggregator.getAllState();
    },

    destroy() {
      for (const vad of vadInstances) {
        vad.destroy();
      }
      vadInstances.length = 0;
    },
  };
}
