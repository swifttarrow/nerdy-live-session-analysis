# Task 002: E2E Latency Test

## Goal

Add E2E test with mock clock for deterministic latency assertions.

## Deliverables

- [ ] E2E test: mock clock controls time
- [ ] Assert per-stage budget (e.g. MediaPipe <200 ms, total <500 ms)
- [ ] Or: assert instrumentation produces values; document actual latency
- [ ] Test passes in CI

## Notes

- Mock clock for determinism
- Per plan: "E2E test with mock clock"

## Verification

- `npm test` includes latency assertions
- Deterministic when using mock clock
