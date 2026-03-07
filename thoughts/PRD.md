# SessionLens

*Building real-time engagement intelligence for live tutoring with computer vision and coaching systems*

---

## Before You Start: Pre-Search (1–2 hours)

Complete the Pre-Search appendix before writing code. Pre-Search output is part of your final submission. This week emphasizes real-time video analysis, computer vision, and coaching systems—use Pre-Search to validate your architecture choices, latency assumptions, and tool selection before implementation.

---

## Background

Live tutoring sessions are the core value proposition of platforms like Varsity Tutors, Wyzant, and Khan Academy's tutoring programs. Yet tutors rarely get real-time feedback on teaching effectiveness. Engagement metrics—eye contact, speaking time balance, and interaction patterns—strongly predict session quality but remain invisible during the session.

You must build a live, AI-powered system that analyzes active video calls, measures engagement metrics, and delivers real-time suggestions or flags to help tutors improve session quality. The core technical challenge is low-latency video/audio processing combined with accurate metric extraction and non-intrusive coaching.

---

## Gate

**Gate:** Project completion required for Austin admission.

---

## Project Overview

One-week sprint with three deadlines:

| Checkpoint       | Deadline | Focus                                      |
|------------------|----------|--------------------------------------------|
| Pre-Search       | Before coding | Architecture discovery, constraints, stack |
| MVP (24 hours)   | Tuesday  | Core pipeline, metrics, basic coaching     |
| Early Submission | Friday   | Full feature set, polish                    |
| Final            | Sunday   | Deployed, documented, demo-ready           |

---

## MVP Requirements (24 Hours)

Hard gate. All items required to pass:

- ☐ Real-time video stream ingestion with frame extraction (tutor and student feeds)
- ☐ Face detection and tracking for both participants
- ☐ At least two engagement metrics: eye contact score and speaking time balance
- ☐ Metric update frequency of 1 Hz minimum
- ☐ Non-intrusive coaching nudge system with at least two trigger types
- ☐ Post-session summary with key metrics and at least one improvement recommendation
- ☐ Latency under 500 ms for real-time feedback path
- ☐ One-command setup and run; README with clear instructions
- ☐ Deployed and publicly accessible

*A simple pipeline with reliable metrics beats a complex pipeline with broken latency.*

---

## Core Technical Requirements

### Feature: Video Analysis Pipeline

| Feature              | Requirements                                                                 |
|----------------------|-------------------------------------------------------------------------------|
| Frame extraction     | Process video streams at sufficient rate for 1–2 Hz metric updates           |
| Face detection       | Detect and track tutor and student faces across frames                       |
| Gaze estimation      | Estimate eye contact / attention toward camera or screen                     |
| Quality handling     | Gracefully handle variable video quality and connectivity issues             |
| Resource usage       | Reasonable CPU/memory for typical hardware                                   |

### Feature: Engagement Metrics Engine

| Feature              | Requirements                                                                 |
|----------------------|-------------------------------------------------------------------------------|
| Eye contact          | Percentage of time participants look at camera/screen; target accuracy ≥85%   |
| Speaking time         | Balance between tutor and student talk time; target accuracy ≥95%             |
| Interruptions        | Detection and counting of speaking overlaps                                   |
| Energy level         | Voice tone and facial expression analysis (optional for MVP)                  |
| Attention drift      | Detection of distraction or disengagement (optional for MVP)                  |

### Feature: Coaching System

| Feature              | Requirements                                                                 |
|----------------------|-------------------------------------------------------------------------------|
| Nudge triggers       | Contextually appropriate timing; configurable sensitivity                    |
| Delivery             | Subtle visual indicators; non-disruptive to session flow                     |
| Examples             | "Student hasn't spoken in 5 minutes"; "Try making more eye contact"          |
| Post-session         | Summary, trend analysis, flagged moments, personalized recommendations       |

### Testing Scenarios

We will test:

1. Normal webcam video (720p, 30 fps) with two participants
2. Poor quality video (low resolution, dropped frames)
3. Variable audio quality and different talk-time ratios
4. Engagement changes during session (e.g., student goes silent)
5. Latency measurement: time from frame capture to metric display
6. One-command setup and run on a fresh environment
7. Post-session report generation with at least two metrics

### Performance Targets

| Metric                  | Target      | Notes                          |
|-------------------------|------------|--------------------------------|
| Analysis latency        | <500 ms    | Frame to displayed metric      |
| Metric update frequency | 1–2 Hz     | Minimum 1 Hz                   |
| Eye contact accuracy    | ≥85%       | vs. human-labeled ground truth |
| Speaking time accuracy  | ≥95%       | vs. human-labeled ground truth |
| System uptime           | 99.5%+     | For deployed application       |
| Resource usage          | Reasonable | No excessive CPU/memory        |

---

## Domain-Specific Deep Section: Real-Time Engagement Analysis

### Required Capabilities

**Video pipeline**

- Input: live video feeds (tutor, student)
- Output: per-frame face detection, gaze estimation, expression/pose (optional)

**Audio pipeline**

- Input: session audio
- Output: speaker diarization, talk-time percentages, overlap detection

**Metrics aggregation**

- Input: raw video/audio outputs
- Output: JSON metrics payload (see schema below)

**Coaching engine**

- Input: metrics stream, configurable thresholds
- Output: nudge events with trigger, message, timing

### Example Metrics Payload

```json
{
  "timestamp": "2024-01-15T14:32:45Z",
  "session_id": "session_123",
  "metrics": {
    "tutor": {
      "eye_contact_score": 0.85,
      "talk_time_percent": 0.65,
      "energy_score": 0.72,
      "current_speaking": true
    },
    "student": {
      "eye_contact_score": 0.78,
      "talk_time_percent": 0.35,
      "current_speaking": false
    }
  }
}
```

### Coaching Nudge Triggers (Implement at least 3)

| Trigger                 | Message                     | Timing      |
|-------------------------|-----------------------------|-------------|
| Student silent >3 min   | "Check for understanding"   | After 3 min |
| Low eye contact         | "Student may be distracted" | After 30 s  |
| Tutor talk >80%         | "Try asking a question"     | After 5 min |
| Energy drop             | "Consider a short break"     | After drop  |
| Interruptions spike     | "Give more wait time"       | After 3+    |

### Evaluation Criteria

- **Input → output mapping:** Given a test video/audio clip, metrics must match expected ranges (e.g., eye contact 0.7–0.9 for "looking at camera" segment)
- **Latency:** Measured end-to-end; must stay under 500 ms
- **Nudge relevance:** Nudges must fire for intended triggers and not be disruptive

### Nudge Design Principles

1. Non-intrusive
2. Actionable
3. Timely
4. Configurable
5. Private (respect consent and retention)

---

## AI Cost Analysis (Required)

### Development & Testing Costs

- LLM API costs (if used for summarization, recommendations, or analysis)
- Token usage per session (input/output)
- Video/audio API calls (e.g., cloud vision, transcription)
- Domain-specific: cost per minute of video processed, per session analyzed

### Production Cost Projections

| Users (sessions/day) | 100   | 1K    | 10K   | 100K  |
|----------------------|-------|-------|-------|-------|
| Video processing     | $X    | $X    | $X    | $X    |
| LLM / summarization  | $X    | $X    | $X    | $X    |
| Storage (session data)| $X   | $X    | $X    | $X    |
| Total estimated      | $X    | $X    | $X    | $X    |

**Include assumptions:**

- Average session length (e.g., 30 min)
- Video resolution and frame rate used for analysis
- Retention period for session data and analytics

---

## Technical Stack

| Layer            | Technology                                                                 |
|------------------|----------------------------------------------------------------------------|
| Backend          | Node.js, Python (FastAPI/Flask), Go                                        |
| Frontend         | React, Vue, Svelte, vanilla JS                                             |
| AI / LLM         | OpenAI, Anthropic, local models (e.g., Ollama), cloud vision APIs          |
| Video / CV       | OpenCV, MediaPipe, cloud vision (e.g., Google Vision, AWS Rekognition)     |
| Audio            | Web Audio API, Vosk, Whisper, cloud transcription                         |
| Database/Storage | PostgreSQL, SQLite, Redis, S3 / object storage                            |
| Deployment       | Vercel, Railway, Fly.io, AWS, GCP                                          |

Use whatever stack helps you ship. Complete the Pre-Search process to make informed decisions.

---

## Build Strategy

### Priority Order

1. Video ingestion and frame extraction pipeline (hardest: latency and reliability)
2. Face detection and gaze estimation (accuracy-critical)
3. Audio pipeline: VAD and speaker diarization
4. Metrics aggregation and JSON output
5. Coaching engine with configurable triggers
6. Post-session analytics and recommendations
7. Dashboard / UI for live metrics and nudges
8. Deployment and one-command setup

### Critical Guidance

- Start with a minimal video pipeline; optimize latency before adding metrics
- Use MediaPipe or similar for fast, local face/gaze if cloud latency is too high
- Validate metric accuracy against labeled clips before building coaching logic
- Make nudges configurable (thresholds, frequency) from day one
- Document privacy and consent flow early; it affects architecture

---

## Required Documentation

### Architecture Document (1–2 pages)

| Section           | Content                                                                 |
|-------------------|-------------------------------------------------------------------------|
| Pipeline overview | Video/audio flow, components, data formats                             |
| Latency budget    | Per-stage breakdown, bottlenecks, mitigations                          |
| Metric methodology| How each metric is computed; calibration approach                       |
| Privacy & consent | What is captured, retained, and who can access it                       |
| Limitations       | Known edge cases, quality dependencies, scaling constraints            |

### Development Log (1 page)

- Key decisions (stack, libraries, tradeoffs)
- What worked and what didn't
- Calibration and accuracy validation approach

---

## Submission Requirements

**Deadline:** Sunday 10:59 PM CT

| Deliverable        | Requirements                                                                 |
|--------------------|-------------------------------------------------------------------------------|
| GitHub Repository  | Public repo, one-command run, clear README                                   |
| Demo Video         | 3–5 min; show live analysis, metrics, coaching, post-session report           |
| Pre-Search Document| Saved AI conversation or structured write-up from Pre-Search appendix        |
| Architecture Doc   | 1–2 pages per table above                                                    |
| AI Cost Analysis   | Dev/testing tracking + production projections table                         |
| Deployed Application | Publicly accessible URL                                                    |
| Social Post        | Tag @GauntletAI                                                              |

---

## Interview Preparation (if gate includes interviews)

*Gate is project completion only; this section is optional.*

**Technical topics**

- How you achieved <500 ms latency; per-stage breakdown
- Tradeoffs: local vs. cloud processing for video/audio
- Scaling: handling 100 vs. 10K concurrent sessions
- Metric accuracy: calibration, ground truth, edge cases
- Privacy: consent, retention, access control

**Mindset & growth**

- How you iterated when initial latency or accuracy was poor
- What you would do differently with more time
- How you prioritized under time pressure

---

## Final Note

A simple pipeline with reliable metrics beats a complex pipeline with broken latency. Project completion is required for Austin admission.

---

## Appendix: Pre-Search Checklist

Complete this before writing code. Save your AI conversation as a reference document.

### Phase 1: Define Your Constraints

1. **Scale and load**
   - How many concurrent sessions do you need to support?
   - What is the expected session length and video resolution?
   - What are your latency and throughput targets?

2. **Budget**
   - What is your budget for cloud APIs (vision, transcription, LLM)?
   - Are you constrained to local/free models only?

3. **Timeline**
   - What can you realistically build in 24 hours for MVP?
   - What is your riskiest dependency (e.g., gaze estimation accuracy)?

4. **Compliance and data sensitivity**
   - What consent and disclosure are required for video/audio analysis?
   - What retention and deletion policies apply?
   - Are there restrictions on where data is processed or stored?

5. **Team and skills**
   - What is your experience with computer vision and real-time systems?
   - Do you prefer browser-based or server-side processing?

### Phase 2: Architecture Discovery

1. **Video processing**
   - MediaPipe vs. OpenCV vs. cloud vision: latency and accuracy tradeoffs?
   - What frame rate and resolution are needed for 1–2 Hz metric updates?
   - How do you handle multiple participants and camera angles?

2. **Audio processing**
   - Local (Vosk, Whisper) vs. cloud transcription: latency and cost?
   - How do you achieve speaker diarization (tutor vs. student)?
   - What is the accuracy of talk-time measurement with your chosen approach?

3. **Gaze and eye contact**
   - What libraries or APIs support gaze estimation in your stack?
   - How do you calibrate for different camera angles and setups?
   - What accuracy is achievable with webcam-quality video?

4. **Real-time architecture**
   - WebRTC vs. WebSocket vs. server-side processing?
   - Where does metric aggregation run (client vs. server)?
   - How do you minimize end-to-end latency?

5. **Coaching system**
   - How do you avoid notification fatigue?
   - What thresholds and timing work for different session types?
   - How do you make nudges configurable without code changes?

6. **Integrations**
   - Does the system need to plug into an existing video platform?
   - What formats are required for post-session reports?

### Phase 3: Post-Stack Refinement

1. **Security and failure modes**
   - What happens if video or audio drops?
   - How do you handle malicious or unexpected input?
   - What authentication and authorization are needed?

2. **Testing**
   - How do you create labeled test clips for metric validation?
   - What automated tests can you run for latency and accuracy?
   - How do you test coaching triggers without live sessions?

3. **Tooling**
   - What debugging and profiling tools help with latency?
   - How do you log and trace metric computation?

4. **Deployment**
   - What deployment target fits your stack and budget?
   - How do you ensure one-command setup for evaluators?
   - What monitoring and alerting do you need?

5. **Observability**
   - What metrics do you expose (latency, accuracy, errors)?
   - How do you debug production issues with video/audio?
