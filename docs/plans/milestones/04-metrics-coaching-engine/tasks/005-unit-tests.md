# Task 005: Unit Tests

## Goal

Add unit tests for coaching engine: synthetic metric streams, trigger firing, cooldowns.

## Deliverables

- [ ] Unit test: synthetic metric stream → triggers fire at expected times
- [ ] Unit test: cooldowns respected (same trigger not fired twice within window)
- [ ] Unit test: metrics schema validation

## Notes

- Use mock/synthetic data for deterministic tests

## Verification

- `npm test` passes
- All trigger scenarios covered
