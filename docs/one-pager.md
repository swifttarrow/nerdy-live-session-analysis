# SessionLens One-Pager

SessionLens measures engagement — the strongest predictor of learning outcomes — and turns it into real-time coaching and analytics for tutors.

---

## Understanding Engagement Quality

Education research consistently shows that student engagement is the strongest predictor of learning outcomes [1]. Engagement is not a single concept: researchers typically divide it into four dimensions — cognitive, behavioral, agentic, and emotional [1, 2]. SessionLens maps observable signals from tutoring sessions onto these four engagement dimensions.

**Basic interaction metrics** (eye contact, speaking time, interruptions, energy, attention) describe *what happened* in the session. **Engagement-quality signals** infer *whether learning is likely happening* — they connect raw behavior to the cognitive, behavioral, agentic, and emotional factors that predict outcomes. The second set matters more because it gives tutors actionable insight into learning, not just session activity.

SessionLens focuses on six measurable signals spanning these categories. These signals were chosen because they are observable in tutoring sessions and measurable with audio/video analysis.


| Signal                 | Category   | What it tells us                                                                                                                           |
| ---------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Response latency**   | cognitive  | Hesitation vs. confidence: long pauses often mean uncertainty; very fast answers can mean overconfidence                                   |
| **Explanation length** | cognitive  | Research shows that self-explanation improves learning                                                                                     |
| **Student talk ratio** | behavioral | Speaking forces retrieving of knowledge, organizing reasoning, and expose misunderstandings, all of which improve memory and understanding |
| **Number of attempts** | behavioral | Persistence and willingness to try; engagement with the task                                                                               |
| **Question asking**    | agentic    | Student initiative and curiosity; willingness to seek clarification                                                                        |
| **Tone / sentiment**   | emotional  | Prosody and sentiment can reveal frustration, confusion, or disengagement, which strongly correlate with learning breakdowns               |


---

## How We Might Measure Each Signal


| Signal                 | How we might measure it                                                                                                                                                                 | Real-time feedback                                                                   | Post-session analysis                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Response latency**   | Time between tutor stops speaking and student starts. VAD on each participant audio stream (or speaker diarization if tracks are mixed); no transcription needed.                       | Yes — per-question latency; nudge if student is silent too long or consistently slow | Yes — average latency, distribution, segments where student hesitated        |
| **Explanation length** | Duration of student speaking per turn. Longer turns often indicate explanation. Optionally: use transcription to distinguish "explanation" from short yes/no.                           | Partial — running talk duration per turn                                             | Yes — aggregate speaking length per turn; identify explanation-rich segments |
| **Student talk ratio** | Student speaking time ÷ total session time. VAD on each participant stream (or diarization if mixed); sum speaking seconds per participant.                                             | Yes — running ratio; nudge if tutor talk >85% or student silent >45 s               | Yes — total ratio; breakdown by session segment                              |
| **Number of attempts** | Count of student "tries" — e.g., submissions, retries, or restarts. Easiest with platform data (exercises, quizzes). Audio-only: approximate via speech restarts or repeated responses. | Deferred for initial version to reduce real-time latency                             | Yes — total attempts, persistence patterns                                   |
| **Question asking**    | Detect questions in student speech. Requires transcription + question detection ("how", "why", "what", rising intonation) or semantic analysis.                                         | Deferred for initial version to reduce real-time latency                             | Yes — count questions, flag moments, classify by type                        |
| **Tone / sentiment**   | Prosody (pitch, energy, speech rate, hesitations) from audio; or sentiment analysis on transcript. Optionally: facial expression from video.                                            | Yes — prosody in real time; sentiment needs transcript                               | Yes — aggregate sentiment, flag frustration or disengagement                 |


**Real-time feedback** = signals we can compute during the session and use for live coaching nudges. 

**Post-session analysis** = signals we aggregate or analyze after the session for the report and recommendations. 

Some signals must be computed with extremely low latency (<1–2s) to support coaching nudges, while others can use heavier processing (transcription, semantic analysis) after the session.

---

## What SessionLens Enables

**Live coaching nudges**

- "Student has been silent for 45 seconds"
- "Tutor speaking 85% of time"
- "Student hesitating repeatedly"

**Post-session analytics**

- Engagement score per session (optionally moderated by instructor delivery quality — see stretch)
- Moments of confusion or frustration
- Tutor talk balance
- Persistence patterns

**Tutor improvement insights**

- Which tutors drive the most student talk
- Which explanations produce more attempts or questions

---

## Instructor Delivery as Moderating Variable (Stretch)

Tutor delivery strongly affects attention and cognitive load. Poor delivery (rambling, filler words, disorganized explanations) increases extraneous load and suppresses student participation. Research shows that some "student engagement problems" are actually tutor delivery problems.

**Treat delivery as a moderating variable:** If student talk ratio is low, check whether the tutor is dominating; if response latency is high, check whether the tutor explanation was long or unclear; if student attempts are low, check whether the tutor is rambling instead of prompting.

**Measurable delivery signals:** Speech fluency (filler word rate, pause frequency, speech restart rate); explanation structure (avg tutor monologue length, turn-taking frequency, question density); confidence (speech rate consistency, prosody variation). These can be factored into the engagement score so that poor delivery dampens the score without fully overriding strong student engagement.

---

## References

[1] Fredricks, J. A., Blumenfeld, P. C., & Paris, A. H. (2004). School engagement: Potential of the concept, state of the evidence. *Review of Educational Research*, 74(1), 59–109. [https://doi.org/10.3102/00346543074001059](https://doi.org/10.3102/00346543074001059)

[2] Reeve, J. (2022). Agentic engagement. In A. L. Reschly & S. L. Christenson (Eds.), *Handbook of Research on Student Engagement* (pp. 95–107). Springer. [https://doi.org/10.1007/978-3-031-07853-8_5](https://doi.org/10.1007/978-3-031-07853-8_5)