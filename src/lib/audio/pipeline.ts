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

  return {
    addTrack(role, stream, onUpdate) {
      void createVad(stream, {
        onSpeechStart: () => {
          aggregator.onSpeechStart(role);
          interruptionTracker?.onSpeechStart(role);
          responseLatencyTracker?.onSpeechStart(role);
          onUpdate(aggregator.getState(role));
        },
        onSpeechEnd: (_audio) => {
          aggregator.onSpeechEnd(role);
          interruptionTracker?.onSpeechEnd(role);
          responseLatencyTracker?.onSpeechEnd(role);
          onUpdate(aggregator.getState(role));
        },
        onVADMisfire: () => {
          // Misfire: treat as silence
          if (aggregator.getState(role).speaking) {
            aggregator.onSpeechEnd(role);
            interruptionTracker?.onSpeechEnd(role);
            responseLatencyTracker?.onSpeechEnd(role);
            onUpdate(aggregator.getState(role));
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
