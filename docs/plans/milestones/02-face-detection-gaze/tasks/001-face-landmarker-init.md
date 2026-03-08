# Task 001: Face Landmarker Init

## Goal

Initialize MediaPipe Face Landmarker and create a wrapper for `detectForVideo()` that processes video frames.

## Deliverables

- [ ] `src/lib/video/face-landmarker.ts` — MediaPipe Face Landmarker init
- [ ] `detectForVideo()` wrapper accepting `VideoFrame` or `ImageData`
- [ ] Config: `numFaces: 1`, `runningMode: "VIDEO"`
- [ ] Downscale to 480p or 640×480 before inference if needed for latency
- [ ] GPU delegate when available

## Notes

- See `video-pipeline-deep-dive.md` for config details
- Model: `face_landmarker.task` in `public/` or CDN
- MediaPipe `detectForVideo()` is synchronous → consider Web Worker for long sessions

## Verification

- Face Landmarker loads and returns landmarks for test frame
- No TypeScript errors; build succeeds
