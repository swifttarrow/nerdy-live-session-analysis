# Task 001: LLM Integration

## Goal

Integrate LLM API for post-session recommendations.

## Deliverables

- [ ] Call LLM (e.g. GPT-4o mini) with session metrics
- [ ] Input: metrics JSON, optional context
- [ ] Output: recommendation text
- [ ] Error handling: fallback to template on failure

## Notes

- Per plan: "personalized" recommendations
- Validate input with Zod; secure API key

## Verification

- LLM returns recommendation
- Fallback works on error
