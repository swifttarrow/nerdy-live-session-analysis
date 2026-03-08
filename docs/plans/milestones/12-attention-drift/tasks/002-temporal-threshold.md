# Task 002: Temporal Threshold

## Goal

Apply temporal threshold to distinguish sustained drift from brief glances.

## Deliverables

- [x] Sustained low gaze (e.g. >5 s) → drift
- [x] Brief glance (<2 s) → not flagged
- [x] Configurable threshold
- [x] Smoothing to avoid flicker

## Notes

- Avoid false positives from natural brief looks
- Per post-MVP plan

## Verification

- Brief glance → no drift
- Sustained look away → drift
- Unit test with synthetic gaze stream
