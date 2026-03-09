# Milestone 24: Post-Session Trend Analysis (Stretch)

## Overview

Add post-session trend analysis across sessions. Stretch goal.

**Source:** [Post-MVP Plan Phase 2.1](../../2025-03-07-sessionlens-post-mvp-draft.md#group-2b-post-session-enhancements-stretch)  
**Est:** 2–3h

## Dependencies

- [ ] Multiple sessions stored (requires persistence)
- [ ] Milestone 05: Post-Session Summary

## Changes Required

- Store session metrics (or aggregates) per session
- Trend: eye contact over sessions, talk ratio over sessions, etc.
- Report: "Compared to previous sessions, eye contact improved 10%"
- Requires: session history, optional backend/db

## Success Criteria

### Manual Verification

- [x] Trend analysis visible when multiple sessions exist
- [x] Comparison to prior sessions

## Tasks

- [001-session-storage](./tasks/001-session-storage.md)
- [002-trend-computation](./tasks/002-trend-computation.md)
- [003-report-integration](./tasks/003-report-integration.md)
