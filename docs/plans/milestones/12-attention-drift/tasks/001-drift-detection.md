# Task 001: Drift Detection

## Goal

Detect attention drift / distraction from gaze patterns.

## Deliverables

- [x] Use eye contact score + head pose from gaze pipeline
- [x] Looking away = low eye contact + head turn
- [x] Output: drift boolean or score (0–1)
- [x] Per participant

## Notes

- Build on existing gaze pipeline
- Per post-MVP: attention drift extends basic eye contact

## Verification

- Looking away → drift detected
- Looking at camera → no drift
