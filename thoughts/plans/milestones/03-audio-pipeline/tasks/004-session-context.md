# Task 004: Session Context

## Goal

Provide session context for audio: tutor left/right channel, single-mic mode, etc.

## Deliverables

- [ ] `src/lib/session/` — session context
- [ ] Config: channel mapping (tutor left, student right) or single-mic
- [ ] Pass context to talk-time aggregation

## Notes

- MVP: in-memory config; session-type presets deferred to post-MVP

## Verification

- Context correctly informs talk-time attribution
- Single-mic mode falls back gracefully
