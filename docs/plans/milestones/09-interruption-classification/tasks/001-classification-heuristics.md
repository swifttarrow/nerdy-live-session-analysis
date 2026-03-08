# Task 001: Classification Heuristics

## Goal

Implement Tier 1 heuristics for productive/neutral/unproductive classification.

## Deliverables

- [ ] Productive: student→tutor interruptions (count as productive by default)
- [ ] Unproductive: tutor→student when ratio or count exceeds threshold
- [ ] Neutral: short overlaps, ambiguous direction, balanced back-and-forth
- [ ] Output: `{ productive: N, unproductive: M, neutral: K }`

## Notes

- Per post-MVP: no transcription; direction-based only
- Research: who interrupts whom matters more than raw count

## Verification

- Synthetic interruptions → correct classification
- Thresholds configurable
