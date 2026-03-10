# SessionLens — Hiring Partner Cheat Sheet

Quick reference for presenting this project in hiring conversations.

---

## Overview of What Was Built

**SessionLens** is a real-time engagement intelligence tool for live tutor–student video sessions. It:

- **Analyzes** eye contact (MediaPipe Face Landmarker) and speaking time (Silero VAD) for both participants
- **Coaches** tutors with non-intrusive nudges when engagement signals drop (e.g., student silent too long, tutor talking too much)
- **Summarizes** sessions with a post-session report: metrics, recommendations, and flagged moments

All video/audio processing runs **entirely in the browser** — no media is sent to any server. Built with Next.js 14, LiveKit for WebRTC, and deployed on Vercel.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Next.js App (session page)                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────────┐ │
│  │ useSessionRoom│  │ MetricsDisplay│  │ NudgeToast / SessionSidePanel  │ │
│  └──────┬───────┘  └──────────────┘  └────────────────────────────────┘ │
└─────────┼───────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Pipelines (browser-only)                                                │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐ │
│  │ Video Pipeline      │  │ Audio Pipeline       │  │ Metrics          │ │
│  │ MediaPipe → gaze    │  │ Silero VAD → talk    │  │ Aggregator       │ │
│  │ → smoothing         │  │ time, interruptions  │  │ (1 Hz emit)     │ │
│  └──────────┬──────────┘  └──────────┬──────────┘  └────────┬──────────┘ │
└─────────────┼────────────────────────┼──────────────────────┼────────────┘
              │                        │                      │
              ▼                        ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Coaching Engine (rule-based)  │  Post-Session (on end)         │ LiveKit │
│  Triggers + cooldowns         │  Summary, recommendations,   │ WebRTC  │
│  → NudgeToast                 │  flagged moments               │         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Data flow:** LiveKit delivers video/audio tracks → frame samplers feed pipelines → aggregator emits validated metrics at 1 Hz → coaching engine evaluates → nudges appear. On session end, report is generated from metrics history and stored in sessionStorage.

---

## Highlights

### Coaching engine with state machine and cooldowns

The coaching engine uses a clean state machine per trigger: `IDLE → condition met → FIRED → cooldown elapsed → IDLE`. Per-trigger accumulated state (e.g., silent seconds, hesitation timestamps) is updated in one place and evaluated in a loop.

```typescript
// src/lib/coaching/engine.ts
function inCooldown(type: TriggerType, now: number): boolean {
  const last = lastFiredAt[type];
  if (last === undefined) return false;
  return (now - last) / 1000 < config.cooldownSec;
}

return {
  evaluate(metrics: SessionMetrics) {
    const now = Date.now();
    triggerState = updateTriggerState(triggerState, metrics, config, now);
    for (const trigger of TRIGGERS) {
      if (inCooldown(trigger.type, now)) continue;
      if (trigger.evaluate(metrics, triggerState, config)) {
        fire(trigger, now);
      }
    }
  },
  // ...
};
```

**Why it matters:** Easy to add new triggers, predictable behavior, and cooldowns prevent nudge spam.

---

### Highlight 2: Session presets with configurable thresholds

Lecture, Practice, and Socratic presets adjust coaching thresholds and cooldowns for different teaching styles:

```typescript
// src/lib/coaching/presets.ts
{
  id: "socratic",
  label: "Socratic",
  tooltip: "More nudges: tutor should stay under 70% talk; student silence over 20 seconds triggers a nudge.",
  config: {
    tutorTalkThreshold: 0.70,
    studentSilentSec: 20,
    cooldownSec: 60,
  },
},
```

**Why it matters:** Tutors can tune behavior without code changes; presets reflect real pedagogy.

---

## 2 Lowlights

### Lowlight 1: Token API lacks input validation

The token route checks for presence with `if (!room || !identity)` but does not validate shape, length, or sanitize with Zod. Per project rules, input should be validated with Zod.

```typescript
// src/app/api/token/route.ts
const room = searchParams.get("room");
const identity = searchParams.get("identity");
// ...
if (!room || !identity) {
  return NextResponse.json({ error: "Missing required params: room, identity" }, { status: 400 });
}
// No Zod or length/sanitization checks
```

**Improvement:** Add Zod schema and validate `room` and `identity` before token generation.

---

### Lowlight 2: `useSessionRoom` is a large hook with many responsibilities

The hook orchestrates LiveKit connection, video/audio pipelines, coaching engine, aggregator, interruption tracker, report generation, and session storage — ~300 lines. It also uses `eslint-disable-next-line react-hooks/exhaustive-deps` for the `startSession` effect.

```typescript
// src/app/session/page.tsx
useEffect(() => {
  if (consented) {
    startSession();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [consented]);
```

**Improvement:** Split into smaller hooks (e.g., `useLiveKitRoom`, `useSessionPipelines`, `useReportGeneration`) and fix the dependency array instead of disabling the rule.

---

## What Would Be Next Steps

### 1. Learning-style personalization (for students)

**Visual learners:**  

- Add “visual recap” moments in the report: “Consider showing a diagram or step-by-step sketch when explaining X.”  
- Flag sessions where student eye contact dropped during long verbal explanations.

**Auditory learners:**  

- Recommend “repeat back” or “explain in your own words” prompts when the student has been mostly silent.  
- Surface “listening” vs “speaking” balance in the report.

**Kinesthetic / hands-on learners:**  

- Add “practice” vs “explanation” ratio to the report.  
- Nudge when the tutor has been talking for a long stretch without a break or activity change.

**Reading/writing learners:**  

- Suggest “shared notes” or “typed summary” prompts.  
- Track “think time” vs “talk time” and recommend written reflection prompts.

**Implementation idea:** Add a `learningStyle` field to the session metadata (from user profile or onboarding). Use it in `generateRecommendations` to branch the template text and add style-specific suggestions.

---

### 2. AI-generated summary and recommendations

Replace template-based recommendations with an LLM call that takes the session summary, metrics, and flagged moments as context and returns a concise narrative and actionable recommendations. Could be done server-side via an API route with streaming for UX.

---

### 3. Recorded clips for flagged moments

Store short clips (e.g., 10–30 seconds) around each flagged moment. On the report page, show a clip player with a “Watch this moment” button for each flagged event. Requires MediaRecorder or similar, plus storage (e.g., S3 or LiveKit Egress).

---

### 4. Instructor delivery quality (stretch)

Measure tutor delivery: speech fluency (filler rate, pause frequency, restart rate), explanation structure (monologue length, turn-taking, question density), confidence (prosody). Factor delivery into the engagement score as a moderating variable — some "student engagement problems" are tutor-driven. See M30 and M31 milestones.

---

## Test Steps

- Run `make setup` then `make run`; open two tabs.
- Join as tutor in one tab, student in another.
- Confirm both see video and live metrics.
- Stay silent as student for 20+ seconds (Socratic preset) → nudge should appear.
- Talk as tutor for 70%+ of session → nudge should appear.
- Click **End Session** → report page should show summary, recommendations, and flagged moments.

