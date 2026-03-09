# Task 002: Hesitation Detection

## Goal

Detect "student hesitating repeatedly" pattern from response latency.

## Deliverables

- [x] Threshold: e.g. >3 long pauses (>2 s) in 2 min
- [x] Or: average latency exceeds threshold
- [x] Emit trigger for coaching engine
- [x] Nudge: "Student hesitating repeatedly — consider giving more think time or rephrasing"

## Notes

- ONE_PAGER: hesitant vs. confident vs. disengaged
- May enhance Milestone 10 trigger

## Verification

- Synthetic pattern → trigger fires
- Cooldown applied
