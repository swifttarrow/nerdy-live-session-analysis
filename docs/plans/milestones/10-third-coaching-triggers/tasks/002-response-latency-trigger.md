# Task 002: Response Latency Trigger

## Goal

Add "Student hesitating repeatedly" trigger based on response latency (time between tutor stops and student starts).

## Deliverables

- [ ] Basic response latency metric: time from tutor stop to student start
- [ ] Trigger: student hesitating repeatedly (e.g. >3 long pauses in 2 min)
- [ ] Nudge: "Student hesitating repeatedly — consider giving more think time or rephrasing"
- [ ] May require Milestone 21 (full response latency) — implement minimal version here if needed

## Notes

- ONE_PAGER: response latency is cognitive signal
- Full implementation in Milestone 21; this is trigger wiring

## Verification

- Synthetic latency pattern → trigger fires
- Nudge copy is actionable
