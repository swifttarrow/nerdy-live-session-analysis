# Task 001: Overlap Detection

## Goal

Detect when tutor and student are both speaking in the same time window.

## Deliverables

- [ ] Run VAD on tutor track and student track independently
- [ ] Define overlap window (e.g. 100–200 ms)
- [ ] Overlap = both tracks have speech in same window
- [ ] Count overlapping windows per session

## Notes

- LiveKit: each participant has own audio track → reliable overlap detection
- Single-mic: not feasible; document limitation

## Verification

- Synthetic VAD segments → overlap count correct
- Both speaking → overlap incremented
