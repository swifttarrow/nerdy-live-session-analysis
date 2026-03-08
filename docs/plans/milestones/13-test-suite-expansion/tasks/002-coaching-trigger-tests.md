# Task 002: Coaching Trigger Tests

## Goal

Add unit tests for coaching triggers and cooldowns.

## Deliverables

- [ ] Synthetic metric stream → each trigger fires at expected times
- [ ] Cooldowns respected (same trigger not fired twice within window)
- [ ] Multiple triggers; no interference
- [ ] Edge: metrics at boundary values

## Notes

- Per plan: "synthetic metric streams → triggers fire at expected times"
- Target: 4+ tests

## Verification

- `npm test` passes
- All trigger types covered
