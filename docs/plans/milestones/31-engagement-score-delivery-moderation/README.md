# Milestone 31: Engagement Score with Delivery Moderation (Stretch)

## Overview

Factor instructor delivery quality into the engagement score as a **moderating variable**. When tutor delivery is poor (rambling, hesitant, high filler rate), the engagement score should be adjusted to reflect that some "student engagement problems" may be tutor-driven. This aligns with research: tutor delivery directly shapes student participation, comprehension, and willingness to interact.

**Source:** [Post-MVP Plan Phase 2d](../../2025-03-07-sessionlens-post-mvp-draft.md#group-2d-instructor-delivery-quality-stretch)  
**Est:** 2h  
**Depends on:** Milestone 30 (Instructor Delivery Quality Metrics)

## Rationale

- **Joint property:** Engagement signals are joint properties of tutor behavior and student behavior, not purely student-driven.
- **Interpretation:** If student talk ratio is low, check whether tutor is dominating; if response latency is high, check whether tutor explanation was long or unclear; if student attempts are low, check whether tutor is rambling instead of prompting.
- **Moderation formula:** Use delivery quality score (0–1) to moderate the raw engagement score — e.g., `adjustedScore = rawScore * (0.5 + 0.5 * deliveryQuality)` or similar, so poor delivery dampens the score without fully overriding strong student engagement.

## Dependencies

- [ ] Milestone 30: Instructor Delivery Quality Metrics
- [ ] Milestone 05: Post-Session Summary (engagement score)

## Changes Required

- Add `deliveryQualityScore` (0–1) to `SessionSummary`
- Update `aggregateSessionSummary()` to accept delivery metrics and compute moderated engagement score
- Update report UI to show delivery-adjusted engagement and explain moderation when delivery is low
- Recommendations: when delivery is low and engagement is low, suggest delivery improvements (e.g., "Consider shorter explanations and more open-ended questions") in addition to student-engagement tips

## Success Criteria

### Automated Verification

- [ ] Unit tests: mock delivery metrics → engagement score adjusts as expected
- [ ] High delivery + low student talk → score reflects both; low delivery + low student talk → score dampened, recommendation mentions delivery

### Manual Verification

- [ ] Report shows delivery-adjusted engagement score
- [ ] Recommendations distinguish tutor-delivery issues from student-engagement issues

## Tasks

- [001-moderation-formula](./tasks/001-moderation-formula.md) — define formula; integrate into summary
- [002-report-display](./tasks/002-report-display.md) — show adjusted score; explain when delivery is low
- [003-recommendations](./tasks/003-recommendations.md) — delivery-aware recommendation logic
