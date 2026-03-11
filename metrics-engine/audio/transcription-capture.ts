/**
 * Captures audio from a MediaStream during speech segments using MediaRecorder.
 * Used for transcription of tutor speech (e.g. Socratic kudos).
 *
 * Handles streams from video.captureStream() which can fail with certain MIME types
 * (e.g. opus) due to codec mismatch between source and recorder.
 */

const MIN_DURATION_MS = 1500; // Skip segments shorter than 1.5s (likely filler)

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "video/webm", // fallback: record video+audio, Whisper extracts audio
  "audio/mp4",
] as const;

export interface TranscriptionCapturer {
  start(): void;
  stop(): Promise<Blob | null>;
  destroy(): void;
}

function getAudioOnlyStream(stream: MediaStream): MediaStream | null {
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) return null;
  return new MediaStream(audioTracks);
}

/**
 * Create a capturer for a MediaStream.
 * Call start() on speech start, stop() on speech end to get a Blob for transcription.
 */
export function createTranscriptionCapturer(stream: MediaStream): TranscriptionCapturer {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let startTimeMs: number | null = null;

  // Use audio-only stream when available (avoids format issues with mixed streams from captureStream)
  const recordStream = getAudioOnlyStream(stream) ?? stream;

  return {
    start() {
      if (mediaRecorder?.state === "recording") return;
      chunks = [];
      startTimeMs = Date.now();

      if (recordStream.getAudioTracks().length === 0) {
        console.warn("[TranscriptionCapturer] No audio tracks in stream");
        return;
      }

      for (const mimeType of MIME_CANDIDATES) {
        if (!MediaRecorder.isTypeSupported(mimeType)) continue;
        try {
          mediaRecorder = new MediaRecorder(recordStream, { mimeType });
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };
          mediaRecorder.start(100);
          return;
        } catch {
          mediaRecorder = null;
        }
      }

      // Last resort: no mimeType, let browser choose
      try {
        mediaRecorder = new MediaRecorder(recordStream);
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
            if (typeof window !== "undefined") {
              console.debug(
                "[TranscriptionCapturer] Dropped segment:",
                durationMs < MIN_DURATION_MS ? `duration ${durationMs}ms < ${MIN_DURATION_MS}ms` : "no chunks"
              );
            }
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
