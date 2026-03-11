# SessionLens One-Pager

Engagement quality is one of the strongest predictors of learning outcomes and correlates with higher student adoption. SessionLens measures engagement during live tutoring sessions and turns it into real-time coaching and post-session analytics to help tutors improve.

---

## What Was Built (per requirements)

**Real-time**

- Video stream analysis (face detection, eye gaze, attention, emotion) via MediaPipe
- Engagement metrics: eye contact, speaking time balance, interruptions, energy level, attention drift
- Response latency and tutor monologue length
- Non-intrusive coaching nudges (toast notifications)
- Configurable sensitivity and session presets

**Post-session**

- Session summary with key metrics and engagement score
- Trend analysis across sessions (stored in localStorage)
- Flagged moments for review (from nudge events)
- Personalized recommendations (template-based, with optional LLM enhancement)

---

## Additions Beyond Requirements

### 1. Testing

- **Unit tests** (Vitest): coaching engine, metrics (talk time, response latency, monologue length), emotion detection, gaze/smoothing, attention cycles, participation, kudos classification, report generation
- **Integration tests**: end-to-end coaching flow with mock metrics
- **E2E tests** (Playwright): full debug path with video upload → playthrough → report

**Video playback / debug mode** makes it easier to troubleshoot live metrics. The `/debug` page lets you upload pre-recorded tutor and student videos instead of joining a live call, then play them through while the full pipeline runs. You can see exactly how metrics respond at specific timestamps and verify triggers without coordinating two devices.

---

### 2. Kudos

Coaching nudges highlight problems; kudos provide **positive reinforcement** when the tutor does something well. They counterbalance the critical feedback and encourage good habits.

**Socratic kudos** (only when Socratic preset is selected):

- **Open-ended probing questions** — e.g., "Why do you think that?", "Can you give an example?" (Whisper + gpt-4.1-nano)
- **Good wait time** — tutor pauses 3–8 seconds before the student responds (response-latency metric)
- **Hypotheticals** — e.g., "What if we changed X?", "Suppose that…" (Whisper + gpt-4.1-nano)

---

### 3. Session Presets

Three presets adjust coaching thresholds to match different teaching styles: **Lecture**, **Practice**, and **Socratic**. Each changes tutor-talk tolerance, student-silence threshold, and cooldowns. Socratic is the most interactive and enables kudos. Presets let tutors tune behavior without code changes.
