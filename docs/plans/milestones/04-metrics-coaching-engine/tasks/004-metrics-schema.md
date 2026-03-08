# Task 004: Metrics Schema

## Goal

Add Zod schema for metrics payload validation (optional but recommended).

## Deliverables

- [ ] `src/lib/session/metrics-schema.ts` — Zod schema for metrics payload
- [ ] Validate aggregator output before emission
- [ ] Type-safe metrics structure

## Notes

- Per user rules: validate input with Zod
- Schema matches PRD metrics format

## Verification

- Invalid payload rejected
- TypeScript types inferred from schema
