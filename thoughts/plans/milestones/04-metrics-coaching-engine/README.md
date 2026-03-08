# Milestone 04: Metrics & Coaching Engine

## Overview

Aggregate video + audio outputs at 1 Hz; emit JSON metrics payload; implement rule-based coaching engine with ≥2 triggers (e.g. "student silent >45 s", "tutor talk >85%", "low eye contact"); state machine with cooldowns. Aligned with ONE_PAGER.

**Source:** [MVP Plan Phase 4](../../2025-03-06-sessionlens-mvp.md#phase-4-metrics--coaching-engine)

## Dependencies

- [ ] Milestone 02: Face Detection & Gaze
- [ ] Milestone 03: Audio Pipeline

## Changes Required

- `src/lib/metrics/aggregator.ts` — combine eye contact + talk-time; emit at 1 Hz
- `src/lib/coaching/engine.ts` — rule-based triggers, state machine, cooldowns
- `src/lib/coaching/triggers.ts` — trigger definitions
- `src/lib/coaching/config.ts` — thresholds (in-memory for MVP)
- `src/lib/session/metrics-schema.ts` — Zod schema for metrics payload (optional)

## Success Criteria

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] Unit tests: synthetic metric streams → triggers fire at expected times; cooldowns respected
- [ ] `npm test` passes

### Manual Verification

- [ ] Metrics update at 1 Hz in UI
- [ ] Nudge fires when student silent 45+ s (or simulated)
- [ ] Nudge fires when eye contact low for 30s
- [ ] Nudges are subtle (no modal)
- [ ] Cooldown prevents spam

## Tasks

- [001-metrics-aggregator](./tasks/001-metrics-aggregator.md)
- [002-triggers-definition](./tasks/002-triggers-definition.md)
- [003-coaching-engine](./tasks/003-coaching-engine.md)
- [004-metrics-schema](./tasks/004-metrics-schema.md)
- [005-unit-tests](./tasks/005-unit-tests.md)
