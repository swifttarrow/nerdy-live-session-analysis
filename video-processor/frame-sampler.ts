/**
 * Frame sampler: extracts frames from a video element at ~1–2 Hz.
 *
 * Uses requestAnimationFrame as the driver for reliable behavior across both
 * live MediaStreams and file-backed video (e.g. debug mode). requestVideoFrameCallback
 * can fire inconsistently for file-backed sources before/during playback.
 */
export type FrameCallback = (
  imageData: ImageData,
  timestamp: number
) => void;

export interface FrameSampler {
  start(): void;
  stop(): void;
}

const TARGET_FPS = 2; // 1–2 Hz
const MIN_INTERVAL_MS = 1000 / TARGET_FPS;

export function createFrameSampler(
  videoEl: HTMLVideoElement,
  onFrame: FrameCallback
): FrameSampler {
  let running = false;
  let lastFrameTime = 0;
  let rafId: number | null = null;

  // Offscreen canvas for pixel extraction
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext("2d")!;

  function processFrame(now: number) {
    if (!running) return;

    const elapsed = now - lastFrameTime;
    if (elapsed >= MIN_INTERVAL_MS && videoEl.readyState >= 2) {
      lastFrameTime = now;

      // Downscale to 640×480 for performance
      const w = Math.min(videoEl.videoWidth || 640, 640);
      const h = Math.min(videoEl.videoHeight || 480, 480);

      if (w > 0 && h > 0) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        ctx.drawImage(videoEl, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        onFrame(imageData, now);
      }
    }
  }

  function tick(now: number) {
    if (!running) return;
    processFrame(now);
    rafId = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastFrameTime = 0;
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
