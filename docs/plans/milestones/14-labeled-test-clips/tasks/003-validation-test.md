# Task 003: Validation Test

## Goal

Add test that runs pipeline on labeled clips and asserts output within tolerance.

## Deliverables

- [ ] Test: for each clip, run pipeline → compare output to labels
- [ ] Assert within tolerance (e.g. eye contact ±0.15, talk-time ±0.1)
- [ ] Or: manual validation checklist if automation not feasible
- [ ] Document results

## Notes

- Use before coaching logic to validate metric accuracy
- Per plan: "accuracy validation"

## Verification

- Pipeline output matches labels within tolerance (or documented deviation)
- Test runs in CI if automated
