# Task 002: Drift Pattern

## Goal

Detect "attention drifted in middle segment" pattern.

## Deliverables

- [ ] Compare segment scores: middle lower than start/end
- [ ] Threshold: e.g. middle segment >0.2 below average
- [ ] Label: "Attention drifted in middle segment"
- [ ] Per ONE_PAGER: extends static distraction to temporal

## Verification

- Synthetic pattern (high-low-high) → drift detected
- Unit test
