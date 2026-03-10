# Task 001: Moderation Formula

## Goal

Define and implement engagement score moderation by delivery quality.

## Deliverables

- [ ] `deliveryQualityScore` (0–1) in SessionSummary
- [ ] Moderation formula: e.g. `adjustedScore = rawScore * (0.5 + 0.5 * deliveryQuality)`
- [ ] Integrate into `aggregateSessionSummary()` when delivery data available
