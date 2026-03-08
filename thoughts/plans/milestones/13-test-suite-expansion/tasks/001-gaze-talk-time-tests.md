# Task 001: Gaze & Talk-Time Tests

## Goal

Add unit tests for gaze derivation and talk-time aggregation.

## Deliverables

- [ ] Gaze: mock landmarks → expected score range
- [ ] Gaze: no face → graceful degradation
- [ ] Talk-time: synthetic VAD segments → % correct
- [ ] Talk-time: no audio → graceful handling
- [ ] Metrics schema validation test

## Notes

- Use synthetic/mock data for determinism
- Target: 5+ tests in this area

## Verification

- `npm test` passes
- Tests are deterministic
