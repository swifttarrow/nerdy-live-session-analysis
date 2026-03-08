# Privacy & Compliance — SessionLens

*Per PRD requirements: "Consent required"; "Clearly disclose what is measured"; "Privacy considerations documented."*

---

## 1. What Is Captured

### What SessionLens Analyzes

| Data Type | How Used | Leaves Device? |
|-----------|---------|---------------|
| **Face landmarks** (478 normalized points) | Gaze score, expression energy, attention drift | **No** — computed in browser, never transmitted |
| **Iris position** (derived from landmarks) | Eye contact score | **No** |
| **Head pose** (derived from landmarks) | Eye contact score (yaw/pitch) | **No** |
| **Speech detection signal** (Silero VAD boolean) | Talk-time percent, interruption detection, voice energy | **No** |
| **Audio RMS energy** (scalar, not audio) | Voice energy level | **No** |
| **Aggregated metrics JSON** (1 Hz payload) | Coaching triggers, post-session report | Only if persisted to DB (opt-in; not implemented in MVP) |

### What SessionLens Does NOT Capture

- ❌ Raw video frames or video recordings
- ❌ Raw audio recordings or audio streams (no audio egress to server)
- ❌ Transcripts or speech content
- ❌ Biometric templates or facial embeddings
- ❌ Screen content or keystrokes

**Browser-first architecture means the most sensitive data (raw video/audio) never leaves the participant's device.** The LiveKit SFU routes media between participants for the video call itself, but SessionLens adds no additional video/audio egress beyond what the WebRTC call requires.

---

## 2. Consent & Disclosure

### Pre-Session Consent Banner

Every participant must actively consent before the session begins. The ConsentBanner presents the following disclosure (verbatim):

> **Before we begin:** SessionLens will analyze face position, gaze direction, and speech patterns during this session to provide engagement coaching. No raw video or audio is stored or sent to our servers. Metrics are processed locally in your browser.
>
> [I Consent – Start Session]  [Decline]

**Requirements met:**
- ✅ Consent is required (session cannot start without it)
- ✅ What is measured is clearly disclosed (face position, gaze direction, speech patterns)
- ✅ What is NOT captured is stated (no raw video/audio storage)
- ✅ Opt-out is available (Decline button)

### Consent Applies to Both Participants

Both the tutor and student see the consent banner before their video/audio is activated. The session page initializes pipelines only after `consented === true`.

---

## 3. Data Retention

### Current Implementation (MVP)

| Data | Retention |
|------|----------|
| Session metrics (aggregated JSON) | **In-memory only** — cleared when the browser tab is closed |
| Post-session report | **In-memory only** — displayed in the browser; not persisted |
| No database or server-side storage | N/A |

### Policy for Production Deployment

When server-side persistence is added:

| Data Type | Default Retention | Deletion |
|-----------|-----------------|---------|
| Aggregated session metrics | 90 days | On request; immediate |
| Post-session reports | 90 days | On request; immediate |
| Raw video/audio | Never stored | N/A |

Retention periods are configurable and can be reduced to 30 days or less at operator discretion.

---

## 4. Access Control

| Role | Access |
|------|--------|
| **Tutor** | Own sessions only; full metrics and report for their sessions |
| **Student** | Own sessions only (if student-facing report is enabled) |
| **Platform admin** | All sessions with role-based authentication; audit log |
| **Aggregate analytics** | Anonymized only; no participant-identifiable data |

Access control is enforced at the session level using LiveKit room tokens with identity and role claims.

---

## 5. Third-Party Services

| Service | What data it receives | Their privacy policy |
|---------|----------------------|---------------------|
| **LiveKit SFU** | WebRTC media (encrypted); participant identity string | LiveKit Privacy Policy |
| **Vercel** (hosting) | HTTP requests, no session content | Vercel Privacy Policy |

Neither service receives face landmarks, gaze scores, or any analyzed metric data. LiveKit receives the same WebRTC media it would for any video call.

---

## 6. Compliance Considerations

### FERPA (Family Educational Rights and Privacy Act)

SessionLens is designed as a tutoring tool that may be used with students. The following FERPA considerations apply:

- **Education records:** Aggregated session metrics (if persisted) may qualify as education records under FERPA. Institutions should ensure they have appropriate consent and data-sharing agreements.
- **Mitigating factor:** Browser-first architecture means raw video/audio is never stored, reducing the sensitivity of retained data.
- **Recommendation:** Schools deploying SessionLens should configure retention to ≤30 days and ensure a Student Data Privacy Agreement (SDPA) is in place with the platform operator.

### COPPA (Children's Online Privacy Protection Act)

If the platform serves students under 13:

- **Consent:** Parental consent is required before any personal data (including session metrics) is collected or retained.
- **Data minimization:** Do not persist session data for minors; use in-session only (memory).
- **Disclosure:** ConsentBanner wording should be age-appropriate and supplemented by a parent-facing notice.
- **Current MVP status:** MVP does not persist data; COPPA requirements are met for in-session use.

### GDPR (if applicable)

For EU users:

- **Lawful basis:** Consent (explicit opt-in via ConsentBanner)
- **Data subject rights:** Right to erasure — honored immediately (in-memory only; for persisted data, deletion on request within 30 days)
- **Processing location:** Browser-first processing occurs on the user's device, within their jurisdiction
- **Data processor:** LiveKit Cloud (SFU) — review their DPA for GDPR compliance

---

## 7. Processing Location

| Component | Processing location |
|-----------|-------------------|
| Face landmark detection | User's browser (local device) |
| Gaze score computation | User's browser |
| Voice activity detection | User's browser |
| Metrics aggregation | User's browser |
| Coaching engine | User's browser |
| Session report generation | User's browser |
| WebRTC media relay | LiveKit SFU (cloud; encrypted in transit) |

The **browser-first design is a privacy-by-default architecture**: the most sensitive data (face, voice) is processed on the device that captured it and never transmitted to a third party for analysis.
