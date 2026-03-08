# Milestone 10: Third Coaching Triggers

## Overview

Add third coaching trigger; wire all 3+ triggers. PRD requires "Implement at least 3." Triggers: tutor talk >85%, interruptions spike, "Student hesitating repeatedly" (response latency).

**Source:** [Post-MVP Plan Phase 1.2](../../2025-03-07-sessionlens-post-mvp-draft.md#group-1-audio--metrics-extensions)  
**Est:** 1–2h

## Dependencies

- [ ] Milestone 04: Metrics & Coaching Engine
- [ ] Milestone 08: Interruptions Detection (for interruptions spike trigger)
- [ ] Milestone 21: Response Latency (for "Student hesitating repeatedly" — or implement basic version here)

## Changes Required

- Ensure ≥3 triggers wired: (1) student silent >45 s, (2) tutor talk >85%, (3) low eye contact, (4) interruptions spike, (5) student hesitating repeatedly
- MVP has 2–3; add interruptions spike and/or response latency nudge
- All triggers with cooldowns; non-intrusive delivery

## Success Criteria

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] Unit tests: all 3+ triggers fire at expected times

### Manual Verification

- [ ] All 3+ trigger types fire when conditions met
- [ ] Nudges remain subtle; cooldowns work

## Tasks

- [001-interruptions-spike-trigger](./tasks/001-interruptions-spike-trigger.md)
- [002-response-latency-trigger](./tasks/002-response-latency-trigger.md)
- [003-wire-all-triggers](./tasks/003-wire-all-triggers.md)
- [004-unit-tests](./tasks/004-unit-tests.md)
