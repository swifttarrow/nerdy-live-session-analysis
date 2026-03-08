# Milestone 06: Dashboard & UI

## Overview

Build session UI: live metrics display, nudge toasts, session start/end flow, consent/disclosure. Ensure non-intrusive coaching delivery.

**Source:** [MVP Plan Phase 6](../../2025-03-06-sessionlens-mvp.md#phase-6-dashboard--ui)

## Dependencies

- [ ] Milestone 04: Metrics & Coaching Engine
- [ ] Milestone 05: Post-Session Summary

## Changes Required

- `src/components/MetricsDisplay.tsx` — live eye contact + talk-time
- `src/components/NudgeToast.tsx` — subtle nudge display
- `src/components/ConsentBanner.tsx` — pre-session consent and disclosure
- `src/pages/session.tsx` — main session view: video feeds, metrics, nudges
- `src/App.tsx` or routing — session → report flow
- Styling (CSS/Tailwind) — minimal, readable

## Success Criteria

### Automated Verification

- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

### Manual Verification

- [ ] Consent shown before session
- [ ] Live metrics visible and updating
- [ ] Nudges appear when triggers fire; not disruptive
- [ ] End session → report loads
- [ ] Responsive on desktop; acceptable on smaller screens

## Tasks

- [001-consent-banner](./tasks/001-consent-banner.md)
- [002-metrics-display](./tasks/002-metrics-display.md)
- [003-nudge-toast](./tasks/003-nudge-toast.md)
- [004-session-view](./tasks/004-session-view.md)
- [005-routing-flow](./tasks/005-routing-flow.md)
