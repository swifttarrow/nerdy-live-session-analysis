# Milestone 27: Configurable Nudge Sensitivity (Stretch)

## Overview

Add UI controls for configurable nudge sensitivity. Stretch: MVP has in-memory config only.

**Source:** [Post-MVP Plan Phase 3.1](../../2025-03-07-sessionlens-post-mvp-draft.md#group-3-ux--config-stretch)  
**Est:** 1–2h

## Dependencies

- [ ] Milestone 06: Dashboard & UI
- [ ] Milestone 04: Metrics & Coaching Engine

## Changes Required

- UI: slider or preset (Low, Medium, High) for nudge sensitivity
- Map to coaching thresholds: student_silent_sec, tutor_talk_threshold, eye_contact_threshold
- Persist preference (localStorage or session)
- Apply to coaching engine at runtime

## Success Criteria

### Manual Verification

- [x] User can adjust sensitivity
- [x] Nudges fire at different rates for different settings
- [x] Preference persists across sessions (if implemented)

## Tasks

- [001-sensitivity-ui](./tasks/001-sensitivity-ui.md)
- [002-threshold-mapping](./tasks/002-threshold-mapping.md)
- [003-persist-apply](./tasks/003-persist-apply.md)
