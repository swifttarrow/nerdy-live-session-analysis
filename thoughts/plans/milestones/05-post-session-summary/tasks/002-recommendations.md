# Task 002: Recommendations

## Goal

Implement template-based recommendations from session metrics.

## Deliverables

- [ ] `src/lib/post-session/recommendations.ts` — template-based recommendations
- [ ] At least one recommendation: e.g. "Student spoke 20% of the time. Consider asking more open-ended questions to increase engagement."
- [ ] Map metrics to recommendations (e.g. low student talk → suggest questions, low eye contact → suggest engagement)

## Notes

- ONE_PAGER: actionable recommendations
- Optional: LLM call with metrics + brief context for richer text (if time permits)

## Verification

- Mock session with low student talk → recommendation suggests questions
- ≥1 recommendation always present
