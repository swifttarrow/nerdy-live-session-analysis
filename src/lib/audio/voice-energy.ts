/**
 * Voice energy from audio using Web Audio API.
 * Computes RMS (Root Mean Square) amplitude as proxy for speaking intensity.
 */

/**
 * Compute RMS energy from a float32 PCM buffer.
 * Signal range [-1, 1] → output range [0, 1].
 */
export function computeRmsEnergy(buffer: Float32Array): number {
  if (buffer.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.min(1, Math.sqrt(sum / buffer.length));
}

export interface VoiceEnergyAnalyser {
  /** Read current RMS energy [0, 1]. Intended to be called at ~1 Hz. */
  getEnergy(): number;
  destroy(): void;
}

/**
 * Create a voice energy analyser for a MediaStream.
 * Uses Web Audio API AnalyserNode to compute real-time RMS energy.
 *
 * @param stream - MediaStream with audio track
 * @param audioContext - optional; creates one if not provided
 */
export function createVoiceEnergyAnalyser(
  stream: MediaStream,
  audioContext?: AudioContext
): VoiceEnergyAnalyser {
  const ctx = audioContext ?? new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.3;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);

  return {
    getEnergy(): number {
      analyser.getFloatTimeDomainData(buffer);
      return computeRmsEnergy(buffer);
    },

    destroy() {
      source.disconnect();
    },
  };
}
