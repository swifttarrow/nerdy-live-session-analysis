# Task 002: Triggers Definition

## Goal

Define ≥2 coaching triggers with thresholds; aligned with ONE_PAGER.

## Deliverables

- [ ] `src/lib/coaching/triggers.ts` — trigger definitions
- [ ] `src/lib/coaching/config.ts` — thresholds (in-memory): `student_silent_sec: 45`, `tutor_talk_threshold: 0.85`, `eye_contact_threshold: 0.5`
- [ ] Triggers: (1) Student silent >45 s, (2) Tutor talk >85%, (3) Low eye contact (<0.5 for 30s)
- [ ] Nudge copy: e.g. "Student has been silent for 45 seconds" / "Check for understanding"

## Notes

- ONE_PAGER-aligned triggers
- Delivery: subtle visual (corner badge, icon pulse, toast); non-intrusive

## Verification

- Triggers defined with correct thresholds
- Nudge copy is actionable
