/**
 * VAD (Voice Activity Detection) wrapper using @ricky0123/vad-web (Silero VAD).
 *
 * Each participant's MediaStream is processed independently via MicVAD,
 * which gives per-track speech/silence segmentation.
 */

export interface VadCallbacks {
  onSpeechStart: () => void;
  onSpeechEnd: (audioData: Float32Array) => void;
  onVADMisfire?: () => void;
}

export interface VadInstance {
  start(): Promise<void>;
  pause(): void;
  destroy(): void;
}

/**
 * Create a VAD instance for a given MediaStream.
 * Returns a handle to start/stop processing.
 *
 * Note: @ricky0123/vad-web dynamically imports ONNX Runtime WASM.
 * Run `npm run setup` (or `make setup`) to copy WASM files to public/.
 */
export async function createVad(
  stream: MediaStream,
  callbacks: VadCallbacks
): Promise<VadInstance | null> {
  try {
    // Dynamic import to avoid SSR issues
    const { MicVAD } = await import("@ricky0123/vad-web");

    const vad = await MicVAD.new({
      stream,
      onSpeechStart: callbacks.onSpeechStart,
      onSpeechEnd: callbacks.onSpeechEnd,
      onVADMisfire: callbacks.onVADMisfire ?? (() => {}),
      // Use public/ WASM files copied by setup script
      workletURL: "/vad.worklet.bundle.min.js",
      modelURL: "/silero_vad.onnx",
      ortConfig(ort) {
        ort.env.wasm.wasmPaths = "/";
      },
    });

    return {
      async start() {
        vad.start();
      },
      pause() {
        vad.pause();
      },
      destroy() {
        vad.destroy();
      },
    };
  } catch (err) {
    console.warn("VAD initialization failed, falling back to energy-based detection:", err);
    return createEnergyVad(stream, callbacks);
  }
}

/**
 * Energy-based VAD fallback when Silero VAD is unavailable.
 * Uses RMS amplitude threshold with hysteresis.
 */
function createEnergyVad(stream: MediaStream, callbacks: VadCallbacks): VadInstance {
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  let speaking = false;
  let silenceStart = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  // Higher threshold to avoid ambient noise (fan, AC, room tone) triggering false speech
  const SPEECH_THRESHOLD = 0.03;
  const SILENCE_DURATION_MS = 500;

  return {
    async start() {
      intervalId = setInterval(() => {
        analyser.getFloatTimeDomainData(buffer);
        const rms = Math.sqrt(buffer.reduce((sum, v) => sum + v * v, 0) / buffer.length);

        if (rms > SPEECH_THRESHOLD) {
          if (!speaking) {
            speaking = true;
            callbacks.onSpeechStart();
          }
          silenceStart = Date.now();
        } else {
          if (speaking && Date.now() - silenceStart > SILENCE_DURATION_MS) {
            speaking = false;
            callbacks.onSpeechEnd(new Float32Array(0));
          }
        }
      }, 100);
    },
    pause() {
      if (intervalId) clearInterval(intervalId);
    },
    destroy() {
      if (intervalId) clearInterval(intervalId);
      audioCtx.close();
    },
  };
}
