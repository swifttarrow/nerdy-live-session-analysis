# Task 001: Latency Computation

## Goal

Compute time between tutor stops speaking and student starts (response latency).

## Deliverables

- [ ] Use VAD: tutor track silence → student track speech
- [ ] Per-turn latency (ms or seconds)
- [ ] Track sequence: tutor speaks → tutor stops → (gap) → student speaks
- [ ] Output: latency per turn, running stats

## Notes

- Per ONE_PAGER: cognitive signal
- Audio pipeline provides VAD per track

## Verification

- Synthetic VAD → latency correct
- Unit test for edge cases (no student response, etc.)
