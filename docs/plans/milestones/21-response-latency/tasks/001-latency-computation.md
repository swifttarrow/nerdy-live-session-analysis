# Task 001: Latency Computation

## Goal

Compute time between tutor stops speaking and student starts (response latency).

## Deliverables

- [x] Use VAD: tutor track silence → student track speech
- [x] Per-turn latency (ms or seconds)
- [x] Track sequence: tutor speaks → tutor stops → (gap) → student speaks
- [x] Output: latency per turn, running stats

## Notes

- Per ONE_PAGER: cognitive signal
- Audio pipeline provides VAD per track

## Verification

- Synthetic VAD → latency correct
- Unit test for edge cases (no student response, etc.)
