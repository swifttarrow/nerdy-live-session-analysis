/**
 * Captures audio from a MediaStream during speech segments using MediaRecorder.
 * Used for transcription of tutor speech (e.g. Socratic kudos).
 */

const MIN_DURATION_MS = 1500; // Skip segments shorter than 1.5s (likely filler)

export interface TranscriptionCapturer {
  start(): void;
  stop(): Promise<Blob | null>;
  destroy(): void;
}

/**
 * Create a capturer for a MediaStream.
 * Call start() on speech start, stop() on speech end to get a Blob for transcription.
 */
export function createTranscriptionCapturer(stream: MediaStream): TranscriptionCapturer {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let startTimeMs: number | null = null;

  return {
    start() {
      if (mediaRecorder?.state === "recording") return;
      chunks = [];
      startTimeMs = Date.now();
      try {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        mediaRecorder.start(100);
      } catch (err) {
        console.warn("[TranscriptionCapturer] MediaRecorder failed:", err);
      }
    },

    async stop(): Promise<Blob | null> {
      const mr = mediaRecorder;
      if (!mr || mr.state !== "recording") return null;

      return new Promise((resolve) => {
        const onStop = () => {
          mr.removeEventListener("stop", onStop);
          const durationMs = startTimeMs ? Date.now() - startTimeMs : 0;
          if (durationMs < MIN_DURATION_MS || chunks.length === 0) {
            resolve(null);
            return;
          }
          const blob = new Blob(chunks, { type: mr.mimeType ?? "audio/webm" });
          resolve(blob);
        };

        mr.addEventListener("stop", onStop);
        mr.stop();
      });
    },

    destroy() {
      if (mediaRecorder?.state === "recording") {
        mediaRecorder.stop();
      }
      mediaRecorder = null;
      chunks = [];
    },
  };
}
