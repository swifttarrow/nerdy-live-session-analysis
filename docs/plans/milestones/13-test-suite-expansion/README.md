# Milestone 13: Test Suite Expansion

## Overview

Expand test suite to 15+ tests. REQUIREMENTS: "15+ tests" for Excellent Technical Implementation; "Handles edge cases."

**Source:** [Post-MVP Plan Phase 5.1](../../2025-03-07-sessionlens-post-mvp-draft.md#group-5-testing--quality-assurance)  
**Est:** 2–3h

## Dependencies

- [ ] MVP complete (Milestones 01–07)

## Changes Required

- Unit: gaze derivation, talk-time aggregation, coaching triggers, metrics schema validation
- Integration: full pipeline with recorded session; coaching triggers fire at expected times; cooldowns respected
- Edge cases: no face, no audio, poor video quality, dropped frames

## Success Criteria

### Automated Verification

- [ ] 15+ tests pass
- [ ] `npm test` passes
- [ ] Edge cases covered

### Manual Verification

- [ ] Test coverage report (optional)
- [ ] All critical paths tested

## Tasks

- [001-gaze-talk-time-tests](./tasks/001-gaze-talk-time-tests.md)
- [002-coaching-trigger-tests](./tasks/002-coaching-trigger-tests.md)
- [003-integration-tests](./tasks/003-integration-tests.md)
- [004-edge-case-tests](./tasks/004-edge-case-tests.md)
