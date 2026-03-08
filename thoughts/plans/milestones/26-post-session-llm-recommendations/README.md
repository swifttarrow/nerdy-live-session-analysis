# Milestone 26: Post-Session LLM Recommendations (Stretch)

## Overview

Add LLM-powered personalized recommendations for post-session report. Stretch: "personalized" recommendations.

**Source:** [Post-MVP Plan Phase 2.3](../../2025-03-07-sessionlens-post-mvp-draft.md#group-2b-post-session-enhancements-stretch)  
**Est:** 2–3h

## Dependencies

- [ ] Milestone 05: Post-Session Summary (template-based exists)
- [ ] LLM API access (e.g. GPT-4o mini)

## Changes Required

- Replace or augment template recommendations with LLM call
- Input: session metrics, brief context
- Output: personalized recommendation text
- Fallback: template if LLM fails or unavailable
- Document in AI Cost Analysis (Milestone 16)

## Success Criteria

### Manual Verification

- [ ] Report shows personalized recommendation when LLM used
- [ ] Fallback to template works
- [ ] Cost documented

## Tasks

- [001-llm-integration](./tasks/001-llm-integration.md)
- [002-prompt-design](./tasks/002-prompt-design.md)
- [003-fallback-cost](./tasks/003-fallback-cost.md)
