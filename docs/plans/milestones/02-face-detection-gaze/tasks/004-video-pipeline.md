# Task 004: Video Pipeline

## Goal

Orchestrate the full video pipeline: per-stream frame → MediaPipe → gaze → smoothing → score.

## Deliverables

- [ ] `src/lib/video/pipeline.ts` — orchestration
- [ ] Process both streams (local + remote) independently
- [ ] Output: `{ tutor: { eye_contact_score: 0.85 }, student: { eye_contact_score: 0.78 } }`
- [ ] Wire frame sampler output into pipeline

## Notes

- Pipeline runs at 1–2 Hz (matches frame sampler)
- Map local stream → tutor, remote → student

## Verification

- Both tutor and student eye contact scores update at 1–2 Hz
- Latency instrumented; p95 < 500 ms (or documented)
