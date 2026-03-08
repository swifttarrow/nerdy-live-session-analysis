# Task 003: Smoothing

## Goal

Apply temporal smoothing (EMA) to eye contact scores to reduce jitter.

## Deliverables

- [ ] `src/lib/video/smoothing.ts` — EMA for score smoothing
- [ ] α ≈ 0.2–0.3 for reasonable responsiveness
- [ ] Handle missing frames (no face) — last known or 0

## Notes

- EMA prevents rapid score fluctuations from frame-to-frame noise
- Per video-pipeline-deep-dive.md

## Verification

- Synthetic score stream → smoothed output has reduced variance
- Unit test for EMA behavior
