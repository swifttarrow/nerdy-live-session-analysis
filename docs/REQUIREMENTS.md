---

# AI-Powered Live Session Analysis

**Real-time engagement analysis and coaching for video tutoring sessions**

---

# Background

Live tutoring sessions are the core value proposition of the platform, yet tutors often lack real-time feedback on their teaching effectiveness. Engagement metrics like eye contact, speaking time balance, and interaction patterns are strong predictors of session quality but are invisible during the session itself.

**Your challenge:** Create a live, AI-powered system that analyzes active video calls to measure engagement metrics and provides real-time suggestions or flags to help tutors improve session quality.

---

# Project Overview

Individual or team project focused on **real-time video analysis, computer vision, and coaching systems**.

## Deliverables

* Real-time video stream analysis pipeline
* Engagement metric calculation (eye contact, speaking time, etc.)
* Non-intrusive tutor notification system
* Post-session analytics dashboard
* Tutor coaching recommendations engine

---

# Core Objectives

* Analyze video streams in real-time with minimal latency
* Calculate meaningful engagement metrics accurately
* Deliver actionable suggestions without disrupting the session
* Help tutors improve their teaching effectiveness over time

---

# Users

**Primary:** Tutors conducting live sessions
**Secondary:** Students (indirect beneficiaries), Quality assurance team

---

# Core Requirements

## 1. Real-Time Video Analysis

Process video streams with low latency for live feedback.

**Specifications**

* Face detection and tracking for tutor and student
* Eye gaze estimation and attention detection
* Latency under **500ms** for real-time feedback
* Handle variable video quality gracefully

---

## 2. Engagement Metrics

Calculate actionable engagement indicators.

**Specifications**

**Eye Contact**

* Percentage of time participants look at camera/screen

**Speaking Time**

* Balance between tutor and student talk time

**Interruptions**

* Detection and counting of speaking overlaps

**Energy Level**

* Voice tone and facial expression analysis

**Attention Drift**

* Detection of distraction or disengagement

---

## 3. Real-Time Coaching

Provide non-intrusive suggestions during sessions.

**Specifications**

* Subtle visual indicators (not disruptive to session flow)
* Contextually appropriate timing for suggestions
* Configurable sensitivity and notification frequency

**Examples**

* “Student hasn't spoken in 5 minutes”
* “Try making more eye contact”

---

## 4. Post-Session Analytics

Comprehensive session review and improvement tracking.

**Specifications**

* Session summary with key metrics
* Trend analysis across multiple sessions
* Specific moments flagged for review
* Personalized improvement recommendations

---

# Inputs & Outputs

## Inputs

**Video Streams**

* Live video feeds from tutor and student

**Audio Streams**

* Session audio for speaking analysis

**Session Context**

* Subject, duration, student level

---

## Outputs

**Live Metrics**

* Real-time engagement scores

**Coaching Nudges**

* Contextual suggestions during session

**Session Report**

* Post-session analytics summary

**Improvement Plan**

* Personalized tutor development recommendations

---

# Technical Architecture

## Modular Structure

```
video-processor/      Real-time video analysis pipeline
metrics-engine/       Engagement metric calculations
coaching-system/      Real-time suggestion generation
analytics-dashboard/  Post-session reporting
docs/                 Decision log and API documentation
```

## Performance Requirements

* Video processing latency: **<500ms**
* Metric update frequency: **1–2 Hz**
* System resource usage: reasonable for typical hardware

---

# Success Criteria

| Category    | Metric                      | Target              |
| ----------- | --------------------------- | ------------------- |
| Performance | Analysis latency            | <500ms              |
| Accuracy    | Eye contact detection       | 85%+                |
| Accuracy    | Speaking time measurement   | 95%+                |
| UX          | Tutor satisfaction          | 4/5+                |
| Impact      | Session quality improvement | Measurable increase |
| Reliability | System uptime               | 99.5%+              |

---

# Ambiguous Elements (You Must Decide)

* How intrusive should real-time coaching be? (Subtle vs explicit)
* What metrics matter most for different session types?
* How to handle poor video quality or connectivity issues?
* Privacy considerations for video analysis

---

# Evaluation Criteria

Submissions are evaluated across **five areas**.

| Area                     | Weight | Focus                             |
| ------------------------ | ------ | --------------------------------- |
| Real-Time Performance    | 25%    | Latency, reliability              |
| Metric Accuracy          | 25%    | Precision of engagement metrics   |
| Coaching Value           | 20%    | Usefulness and timing of feedback |
| Technical Implementation | 15%    | Architecture and scalability      |
| Documentation            | 15%    | Decisions, limitations, privacy   |

---

# Real-Time Performance (25%)

### Excellent (23–25)

* Latency <300ms
* Smooth metric updates (1–2 Hz minimum)
* Handles video quality variations gracefully
* Reasonable CPU usage
* No dropped frames or audio gaps

### Good (18–22)

* Latency <500ms
* Metric updates at 1 Hz
* Handles most video conditions

### Acceptable (13–17)

* Latency <1 second
* Metric updates every 2–3 seconds
* Some issues with poor video

### Needs Improvement (0–12)

* Latency >1 second
* Infrequent updates
* Fails with video quality issues

---

# Metric Accuracy (25%)

### Excellent

* Eye contact detection ≥85%
* Speaking time measurement ≥95%
* Reliable speaker diarization
* Interruption detection with low false positives

### Good

* Eye contact ≥75%
* Speaking time ≥90%
* Good speaker separation

### Acceptable

* Eye contact ≥65%
* Speaking time ≥85%

### Needs Improvement

* Eye contact unreliable
* Speaking time inaccurate

---

# Coaching Value (20%)

### Excellent

* Nudges actionable and specific
* Proper timing (not disruptive)
* Configurable sensitivity
* Valuable post-session insights

### Needs Improvement

* Nudges missing or not useful
* Disruptive timing
* No post-session insights

---

# Technical Implementation (15%)

### Excellent

* Clean modular architecture
* One-command setup
* 15+ tests
* Handles edge cases

### Needs Improvement

* Disorganized code
* Difficult setup
* Few tests

---

# Documentation (15%)

### Excellent

* Comprehensive decision log
* Privacy analysis
* Clear limitations
* Calibration methodology

### Needs Improvement

* Missing documentation
* Privacy not addressed
* No limitations documented

---

# Scoring Summary

| Score  | Grade      | Description              |
| ------ | ---------- | ------------------------ |
| 90–100 | Excellent  | Exceeds expectations     |
| 80–89  | Good       | Strong work              |
| 70–79  | Acceptable | Meets basic requirements |
| 60–69  | Needs Work | Missing key elements     |
| <60    | Incomplete | Does not meet minimum    |

---

# Automatic Deductions

* No working demo: **–10**
* Cannot run with instructions: **–10**
* Latency >2 seconds: **–10**
* No real-time component: **–15**
* No coaching nudges: **–10**

---

# Bonus Points

* Browser-based implementation: **+3**
* Multi-participant support: **+3**
* Exceptional visualization: **+2**
* Novel engagement metrics: **+2**

---

# Test Scenarios

Evaluation will include:

* Normal webcam video (720p, 30fps)
* Poor quality video
* Variable audio quality
* Different talk-time ratios
* Engagement changes during sessions

---

# Submission Checklist

* Code runs with one command
* README explains setup
* Real-time latency measured
* Metric accuracy validated
* Coaching nudges functional
* Post-session analytics available
* Privacy considerations documented
* Decision log included
* Limitations stated
* Demo video included

---

# Starter Kit

## Key Engagement Metrics

### Eye Contact / Attention

Measures:

* Camera gaze
* Looking away
* Mutual attention

Challenges:

* Camera angle variations
* Multi-monitor setups

---

### Speaking Time Balance

Measures:

* Tutor vs student talk ratio
* Turn lengths
* Response latency

Benchmarks:

* Lecture: **70–80% tutor**
* Practice: **30–50% tutor**
* Socratic discussion: **40–60% tutor**

---

### Interruptions

Measures:

* Overlapping speech
* Who interrupts whom
* Frequency patterns

---

### Energy Level

Measures:

* Voice variation
* Facial expression
* Speech rate

---

### Attention Drift

Measures:

* Sudden engagement drops
* Lack of response
* Physical indicators

---

# Technical Approaches

## Video Pipeline

```
Video Stream
 → Frame Extraction
 → Face Detection
 → Gaze Estimation
 → Expression Analysis
 → Body Pose
 → Engagement Indicators
```

## Audio Pipeline

```
Audio Stream
 → Voice Activity Detection
 → Speaker Diarization
 → Talk Time Metrics
 → Overlap Detection
 → Prosody Analysis
```

---

# Real-Time Architecture

```
Video/Audio Stream
      │
      ▼
Processing Pipeline
      │
      ▼
Metrics Dashboard
      │
      ▼
Coaching Nudges
```

---

# Coaching Nudge Examples

| Trigger               | Message                     | Timing      |
| --------------------- | --------------------------- | ----------- |
| Student silent >45 s | "Student has been silent for 45 seconds" / "Check for understanding" | After 45 s |
| Low eye contact      | "Student may be distracted" | After 30s   |
| Tutor talk >85%      | "Tutor speaking 85% of time" / "Try asking a question" | After threshold |
| Energy drop           | "Consider a short break"    | After drop  |
| Interruptions spike   | "Give more wait time"       | After 3+    |

---

# Nudge Design Principles

1. **Non-intrusive**
2. **Actionable**
3. **Timely**
4. **Configurable**
5. **Private**

---

# Example Data Structures

## Real-Time Metrics

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
    }
  }
}
```

---

# Privacy Considerations

* Consent required for analysis
* Define data retention policies
* Access control for analytics
* Consider anonymization
* Clearly disclose what is measured

---