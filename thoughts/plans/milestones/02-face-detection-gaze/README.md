# Milestone 02: Face Detection & Gaze

## Overview

Integrate MediaPipe Face Landmarker; process each stream (tutor + student) separately; derive eye contact score from iris landmarks and head pose; apply temporal smoothing (EMA).

**Source:** [MVP Plan Phase 2](../../2025-03-06-sessionlens-mvp.md#phase-2-face-detection--gaze)

## Dependencies

- [ ] Milestone 01: Project Setup & WebRTC

## Changes Required

- `src/lib/video/face-landmarker.ts` — MediaPipe Face Landmarker init, `detectForVideo()` wrapper
- `src/lib/video/gaze.ts` — derive `eye_contact_score` from iris position + head pose
- `src/lib/video/smoothing.ts` — EMA for score smoothing (α ≈ 0.2–0.3)
- `src/lib/video/pipeline.ts` — orchestrate: per-stream frame → MediaPipe → gaze → smoothing → score
- `package.json` — add `@mediapipe/tasks-vision`
- Model: `face_landmarker.task` in `public/` or served via CDN

## Success Criteria

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] Unit test: mock landmarks → gaze derivation returns expected score range
- [ ] Latency: instrument pipeline; assert p95 < 500 ms (or document if exceeded)

### Manual Verification

- [ ] Face detected for both tutor and student; eye contact scores update at 1–2 Hz
- [ ] Looking at camera → score ~0.7–1.0; looking away → score drops
- [ ] No face: graceful degradation (last known or 0)
- [ ] Correct attribution: tutor metrics from local stream, student from remote

## Tasks

- [001-face-landmarker-init](./tasks/001-face-landmarker-init.md)
- [002-gaze-derivation](./tasks/002-gaze-derivation.md)
- [003-smoothing](./tasks/003-smoothing.md)
- [004-video-pipeline](./tasks/004-video-pipeline.md)
- [005-unit-tests](./tasks/005-unit-tests.md)
