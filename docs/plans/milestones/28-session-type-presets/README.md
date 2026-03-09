# Milestone 28: Session-Type Presets (Stretch)

## Overview

Add session-type presets: Lecture, Practice, Socratic. MVP has General only. Stretch goal.

**Source:** [Post-MVP Plan Phase 3.2](../../2025-03-07-sessionlens-post-mvp-draft.md#group-3-ux--config-stretch)  
**Est:** 2–3h

## Dependencies

- [ ] Milestone 04: Metrics & Coaching Engine
- [ ] Milestone 06: Dashboard & UI

## Changes Required

- Presets: Lecture (tutor-heavy OK), Practice (balanced), Socratic (student-heavy)
- Each preset: different coaching thresholds, optional metric weights
- UI: select preset before/during session
- Report: may interpret metrics differently per preset

## Success Criteria

### Manual Verification

- [x] User can select preset
- [x] Coaching behavior differs by preset
- [x] Report reflects preset context

## Tasks

- [001-preset-definitions](./tasks/001-preset-definitions.md)
- [002-preset-ui](./tasks/002-preset-ui.md)
- [003-preset-logic](./tasks/003-preset-logic.md)
