# Task 005: Unit Tests

## Goal

Add unit tests for gaze derivation and pipeline; verify latency constraints.

## Deliverables

- [ ] Unit test: mock landmarks → gaze derivation returns expected score range
- [ ] Unit test: no face → graceful degradation
- [ ] Latency instrumentation in pipeline; assert p95 < 500 ms or document

## Notes

- Use synthetic/mock data for deterministic tests
- Latency may vary by device; document if exceeded

## Verification

- `npm test` passes
- Latency assertions or documentation complete
