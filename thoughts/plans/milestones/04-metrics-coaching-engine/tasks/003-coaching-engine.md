# Task 003: Coaching Engine

## Goal

Implement rule-based coaching engine with state machine and cooldowns.

## Deliverables

- [ ] `src/lib/coaching/engine.ts` — rule-based triggers, state machine, cooldowns
- [ ] Consume metrics stream; evaluate triggers
- [ ] Cooldown prevents spam (e.g. same trigger not fired again within N seconds)
- [ ] Emit nudge events for UI consumption

## Notes

- State machine: trigger conditions → fire → cooldown → reset
- Non-intrusive delivery (no modal)

## Verification

- Synthetic metric stream → triggers fire at expected times
- Cooldowns respected
- Unit tests pass
