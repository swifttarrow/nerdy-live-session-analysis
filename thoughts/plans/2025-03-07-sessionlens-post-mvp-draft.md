# SessionLens Post-MVP Plan

**Builds on:** [2025-03-06-sessionlens-mvp.md](./2025-03-06-sessionlens-mvp.md)  
**Source:** [thoughts/PRD.md](../PRD.md)  
**Engagement model:** [ONE_PAGER.md](../../ONE_PAGER.md) — engagement-quality signals (response latency, student talk ratio, etc.) matter more than basic metrics for actionable learning insight.

---

## Gap Analysis: MVP vs PRD


| PRD Requirement                                        | MVP Status                 | Proposed                                      |
| ------------------------------------------------------ | -------------------------- | --------------------------------------------- |
| **Interruptions** (speaking overlaps)                  | Deferred                   | **Required** — in Core Technical Requirements |
| **≥3 coaching triggers**                               | MVP has 2 (+ optional 3rd) | **Required** — PRD: "Implement at least 3"    |
| **Energy level** (voice + expression)                  | Deferred                   | **Included** — PRD optional for MVP           |
| **Attention drift** (distraction)                      | Deferred                   | **Included** — PRD optional for MVP           |
| **AI Cost Analysis**                                   | Not in MVP                 | **Required** — PRD: "Required" section        |
| **Architecture Document**                              | Not in MVP                 | **Required** — Submission                     |
| **Development Log**                                    | Not in MVP                 | **Required** — Submission                     |
| **Demo Video** (3–5 min)                               | Not in MVP                 | **Required** — Submission                     |
| **Post-session: trend analysis**                       | Not in MVP                 | **Stretch**                                   |
| **Post-session: flagged moments**                      | Not in MVP                 | **Stretch**                                   |
| **Post-session: LLM recommendations**                  | Optional in MVP            | **Stretch** — "personalized"                  |
| **Configurable nudge sensitivity (UI)**                | In-memory config only      | **Stretch**                                   |
| **Session-type presets** (Lecture, Practice, Socratic) | General only               | **Stretch**                                   |
| **Auth / OAuth**                                       | Session tokens only        | **Excluded** — skip for now                   |

---

## Interruptions: "Best Effort" Elaboration

**Interruptions** = detection and counting of speaking overlaps (tutor and student talking at the same time).

### What "best effort" means

| Audio setup | Overlap detection | Approach |
|-------------|-------------------|----------|
| **LiveKit (separate tracks)** | **Reliable** | Each participant has their own audio track. Run VAD on tutor track and student track independently. Overlap = both have speech in the same time window (e.g. 100–200 ms). Count overlapping windows; aggregate per session. |
| **Stereo (tutor left, student right)** | **Reliable** | Same as above: VAD per channel; overlap when both channels active in same window. |
| **Single-mic (mixed audio)** | **Not feasible** | VAD only tells us "someone is speaking," not who. Without diarization (Whisper, pyannote), we cannot distinguish tutor vs student vs both. Best effort = document "interruptions N/A for single-mic" and show 0 or omit. |

**Recommendation:** MVP uses LiveKit; each participant publishes their own audio track. The analysis client receives **tutor audio track** (local) + **student audio track** (remote). We can run VAD on each and detect overlaps reliably—no "best effort" compromise needed for the primary LiveKit path. Fallback: if we ever support a single mixed stream, document the limitation.

---

## Interruption Classification & Productive/Unproductive/Neutral Analysis

Raw interruption count is a weak signal. Research shows the *type* and *direction* of interruptions matter more than frequency. We add classification and analysis so the system can distinguish productive engagement from disengagement or poor flow.

### Research-Inspired Classification

| Type | Usually indicates | Label |
|------|-------------------|-------|
| Clarifying questions ("Wait, why does that work?") | Productive engagement | **Productive** |
| Conceptual challenge, testing hypotheses | Deep engagement | **Productive** |
| Procedural questions ("What do we do next?") | Instruction clarity | **Neutral** |
| Social/off-task, side conversations | Disengagement | **Unproductive** |
| Teacher interrupts student (excessive) | Can suppress participation | **Unproductive** |

*Bottom line: Who interrupts whom, and whether it advances the learning conversation, matters more than raw count.*

### Implementation Tiers

| Tier | Input | Output | Feasibility |
|------|-------|--------|-------------|
| **Tier 1: Directional** | VAD per track, overlap windows | Who interrupted whom (student→tutor vs tutor→student), overlap count, duration. Proxy: student→tutor often = engagement; tutor→student spike = potential suppression. | **No transcription** — build on Phase 1.1 |
| **Tier 2: Content-based** | Transcription (Whisper or similar) of overlapping segments | Keyword/heuristic classification: clarifying ("why", "what", "how", "wait"), procedural, off-topic. Map to productive/neutral/unproductive. | **Requires transcription** — add to audio pipeline |
| **Tier 3: Semantic** | Transcript + context | LLM pass for ambiguous cases; richer labels (e.g. "conceptual challenge" vs "clarifying"). | **Stretch** — post-session or optional |

### Tier 1 Heuristics (No Transcription)

- **Productive:** Student→tutor interruptions (student engages, clarifies, challenges) — count as productive by default
- **Unproductive:** Tutor→student interruptions (can suppress participation if excessive) — flag when ratio or count exceeds threshold
- **Neutral:** Short overlaps, ambiguous direction, or balanced back-and-forth — default when unclear

Output: `{ productive: N, unproductive: M, neutral: K }` plus directional breakdown for post-session report.

### Deliverables (Phased)

- **Phase 1.1:** Overlap detection + directional attribution (who interrupted whom)
- **Phase 1.1b:** Productive/neutral/unproductive scoring using Tier 1 heuristics; post-session breakdown in report
- **Phase 1.1c (stretch):** Tier 2 — add transcription of overlap segments; content-based classification; include in live metrics or post-session report

---

## Phase Structure (Natural Grouping)

Phases grouped by related functionality; order respects dependencies.

### Group 1: Audio & Metrics Extensions

| Phase | Scope | Est. |
|-------|-------|------|
| **1.1** | Interruptions detection (VAD per LiveKit track → overlap count + directional: who interrupted whom) | 2–3h |
| **1.1b** | Interruption classification: productive/neutral/unproductive (Tier 1 heuristics; post-session breakdown) | 2–3h |
| **1.1c** | *(Stretch)* Tier 2: transcription of overlap segments; content-based classification | 3–4h |
| **1.2** | Third coaching trigger (tutor talk >85% per ONE_PAGER) + interruptions spike + "Student hesitating repeatedly" (response latency); wire all 3+ | 1–2h |
| **1.3** | Energy level — voice tone + facial expression | 3–4h |
| **1.4** | Attention drift — distraction/disengagement detection | 2–3h |

### Group 2: Engagement Quality Extensions

*ONE_PAGER: engagement-quality signals matter more than basic metrics. Response latency and student talk ratio have real-time feedback; prioritize these.*

| Phase | Scope | Est. |
|-------|-------|------|
| **2.0a** | **Response latency** — time between tutor stops speaking and student starts; real-time nudge "Student hesitating repeatedly" + post-session (ONE_PAGER: cognitive signal) | 2–3h |
| **2.0b** | Participation balance with engagement interpretation — student talk ratio + "passive vs. engaged" framing in report (ONE_PAGER: primary behavioral signal) | 1–2h |
| **2.0c** | Attention cycles — gaze patterns over time; "attention drifted in middle segment" vs. static distraction count | 2–3h |

### Group 2b: Post-Session Enhancements (Stretch)

| Phase | Scope | Est. |
|-------|-------|------|
| **2.1** | Post-session: trend analysis across sessions | 2–3h |
| **2.2** | Post-session: flagged moments for review | 2h |
| **2.3** | Post-session: LLM-powered personalized recommendations | 2–3h |

### Group 3: UX & Config (Stretch)

| Phase | Scope | Est. |
|-------|-------|------|
| **3.1** | Configurable nudge sensitivity (UI controls) | 1–2h |
| **3.2** | Session-type presets (Lecture, Practice, Socratic) | 2–3h |

### Group 4: Documentation & Submission

| Phase | Scope | Est. |
|-------|-------|------|
| **4.1** | AI Cost Analysis document | 1–2h |
| **4.2** | Architecture Document (1–2 pages) | 1–2h |
| **4.3** | Development Log (1 page) | 1h |
| **4.4** | Demo Video (3–5 min) | 1h |

---

## Engagement Quality: Beyond Interruptions

*ONE_PAGER: Six engagement-quality signals span cognitive, behavioral, agentic, emotional dimensions. Basic metrics (interruptions, eye contact) describe what happened; these infer whether learning is likely.*

The system aims to understand *engagement quality*, not just raw counts. Interruptions (with quality/direction) are a basic signal. Phases 2.0a–2.0c add engagement-quality signals:

| Signal | What it surfaces | ONE_PAGER | Source |
|--------|------------------|-----------|--------|
| **Response latency** | Hesitant vs. confident vs. disengaged — time between tutor stops and student starts | Real-time + post-session; nudge "Student hesitating repeatedly" | Audio (VAD + timing) |
| **Participation balance** | Passive vs. engaged — student talk ratio with explicit interpretation | Primary behavioral signal; real-time nudge at 85% tutor | Audio (talk time) |
| **Attention cycles** | Distraction patterns over time — "drifted in middle segment" vs. static count | Extends attention (basic) to temporal patterns | Video (gaze) |

*Deferred for initial version (ONE_PAGER):* Number of attempts, Question asking — post-session only to reduce real-time latency.

---

## Recommended Execution Order

1. **Group 1** (1.1 → 1.1b → 1.2 → 1.3 → 1.4; 1.1c if stretch) — core feature gaps
2. **Group 4** (4.1 → 4.2 → 4.3 → 4.4) — required for submission; can parallelize with Group 2/3
3. **Group 2** (2.0a → 2.0b → 2.0c; then 2.1 → 2.2 → 2.3) — engagement quality stretch, then post-session stretch
4. **Group 3** (3.1 → 3.2) — stretch, if time permits

---

## Next Steps

1. Review phase structure and estimates.
2. I can add detailed phase specs (changes required, success criteria) for each phase.
3. Optionally: generate milestones/tasks for the chosen scope.

