# Milestone 05: Post-Session Summary

## Overview

Generate post-session summary with key metrics and ≥1 improvement recommendation. Start with template-based; optional LLM (GPT-4o mini) if time permits.

**Source:** [MVP Plan Phase 5](../../2025-03-06-sessionlens-mvp.md#phase-5-post-session-summary)

## Dependencies

- [ ] Milestone 04: Metrics & Coaching Engine

## Changes Required

- `src/lib/post-session/summary.ts` — aggregate session metrics, generate summary
- `src/lib/post-session/recommendations.ts` — template-based recommendations
- `src/lib/post-session/report.ts` — combine summary + recommendations; output JSON or structured object
- `src/pages/report.tsx` or similar — display report

## Success Criteria

### Automated Verification

- [x] `npm run build` succeeds
- [x] Unit test: mock session data → report contains expected fields and ≥1 recommendation

### Manual Verification

- [ ] End session → report displays
- [ ] Report shows key metrics
- [ ] Report includes ≥1 actionable recommendation
- [ ] Recommendation is relevant to metrics (e.g. low student talk → suggest questions)

## Tasks

- [001-summary-aggregation](./tasks/001-summary-aggregation.md)
- [002-recommendations](./tasks/002-recommendations.md)
- [003-report-generation](./tasks/003-report-generation.md)
- [004-report-page](./tasks/004-report-page.md)
- [005-unit-tests](./tasks/005-unit-tests.md)
