# Task 004: Frame Sampler

## Goal

Implement frame extraction from video elements at 1–2 fps for downstream MediaPipe processing.

## Deliverables

- [ ] `src/lib/video/frame-sampler.ts` — accepts `HTMLVideoElement` (local or remote)
- [ ] Sample every 15–30 frames at 30 fps → 1–2 Hz
- [ ] Use `requestVideoFrameCallback` or `requestAnimationFrame` with frame skip
- [ ] Output: `VideoFrame` or `ImageData` per stream for downstream pipeline

## Notes

- Each video element (local + remote) gets its own sampler
- Frame sampler must work with both LiveKit video tracks
- See `video-pipeline-deep-dive.md` for pipeline context

## Verification

- Frame sampler logs at 1–2 Hz for both streams (console or debug UI)
- Output format compatible with MediaPipe `detectForVideo()`
