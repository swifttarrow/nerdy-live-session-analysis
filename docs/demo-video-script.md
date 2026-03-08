# Demo Video Script — SessionLens

*3–5 minute screen recording. This file is a production guide; the video must be recorded manually.*

---

## Recording Setup

- **Screen recorder:** OBS Studio, QuickTime, or Loom
- **Two browser tabs/windows:** One as tutor (teacher role), one as student
- **Or:** Two devices / one device + one participant joining remotely
- **Resolution:** 1080p preferred; 720p minimum
- **Duration target:** 3–5 minutes

---

## Pre-Recording Checklist

- [ ] App running locally (`npm run dev`) or deployed URL accessible
- [ ] LiveKit credentials set in `.env.local`
- [ ] Both browser windows open to: `/?role=teacher` and `/?role=student`
- [ ] Same room name set for both (e.g., `?room=demo-session`)
- [ ] Microphone working on at least one tab
- [ ] Camera working on both tabs (or use a video file as virtual camera for student)

---

## Scene-by-Scene Script

### Scene 1 — Introduction (0:00–0:30)

**Narrate:**
> "This is SessionLens — a real-time engagement intelligence system for live tutoring. It analyzes eye contact, speaking balance, energy, and attention drift during sessions, and delivers non-intrusive coaching nudges to help tutors improve session quality. All processing runs in the browser — no video or audio leaves the device."

**Show:** Landing page or session setup screen.

---

### Scene 2 — Consent (0:30–1:00)

**Narrate:**
> "Before joining, each participant sees a consent banner that clearly discloses what is measured: face position, gaze direction, and speech patterns. No raw video or audio is stored or transmitted to a server."

**Show:** ConsentBanner appearing; click "I Consent – Start Session."

---

### Scene 3 — Session Join & Video Call (1:00–2:00)

**Narrate:**
> "Both the tutor and student join the same room. SessionLens immediately begins analyzing both video streams using MediaPipe Face Landmarker — running entirely in WebAssembly and WebGL at around 5 frames per second."

**Show:**
- Both video feeds visible
- Metrics panel updating in real time (eye contact score, talk-time percentage)
- Speak briefly on both tabs; show talk-time updating

---

### Scene 4 — Live Metrics (2:00–2:45)

**Narrate:**
> "Metrics update at 1 Hz. Eye contact is derived from iris position and head pose — a score of 1.0 means looking directly at the camera. Talk-time percentage accumulates across the session. Energy level combines voice RMS and facial animation."

**Show:**
- Move your face toward/away from camera and see eye contact score change
- Speak loudly vs. quietly and narrate the energy level
- Point at the MetricsDisplay panel values

---

### Scene 5 — Coaching Nudges (2:45–3:30)

**Narrate:**
> "When the tutor is doing too much of the talking — over 85% — SessionLens fires a nudge. Other triggers include extended student silence, low eye contact, interruption spikes, and student hesitation."

**Show:**
- Stop speaking on the student tab; after ~45 seconds of student silence, a nudge fires: "Student has been silent"
- **Or:** On the tutor tab, talk continuously — after some time the "You're doing most of the talking" nudge appears
- Show the NudgeToast appearing as an overlay, non-intrusively

*Tip: You can temporarily lower the `studentSilentSec` threshold in `config.ts` to 5s for demo speed, then restore it.*

---

### Scene 6 — End Session & Report (3:30–4:30)

**Narrate:**
> "At the end of the session, SessionLens generates a post-session report with engagement score, metric averages, and personalized recommendations."

**Show:**
- Click "End Session" button
- Report page displays: engagement score, avg eye contact, talk-time balance, student talk ratio
- Scroll through recommendations

---

### Scene 7 — Wrap-Up (4:30–5:00)

**Narrate:**
> "SessionLens is deployed and publicly accessible. The full source code, architecture document, and AI cost analysis are in the GitHub repository. All computer vision and audio analysis runs in the browser — zero cloud API costs per session."

**Show:** Briefly show the GitHub repo or the deployed URL.

---

## Post-Recording Checklist

- [ ] Trim to 3–5 minutes
- [ ] Add captions or title cards if helpful (tool: CapCut, DaVinci Resolve, or Descript)
- [ ] Upload to YouTube (unlisted or public) or Loom
- [ ] Add video link to your submission form

**Suggested title:** "SessionLens Demo — Real-Time Tutoring Engagement Analysis (Gauntlet AI)"

---

## Notes

- The ConsentBanner is required to appear — evaluators check for consent disclosure
- At least one nudge must fire and be visible
- The report page must show at least two metrics and one recommendation
- Both participants (tutor + student) must be visible in the video call
