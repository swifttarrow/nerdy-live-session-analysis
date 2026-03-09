# SessionLens Demo Script

**Topic:** Engagement metrics that help predict learning outcomes  
**Duration:** ~10 minutes reading time  
**Participants:** Tutor + Student (2 readers)

---

## Setup

1. **Before starting:** Run `make setup` then `make run`. Open two browser tabs.
2. **Lobby:** Tab 1 — join as **Tutor**; Tab 2 — join as **Student**. Use the same room name.
3. **Session type:** Select **Socratic** preset (triggers nudges sooner for demo).
4. **Consent:** Both participants grant camera/microphone access.

---

## Script

*Stage directions in [brackets]. Pause where indicated to let metrics and nudges register.*

---

### Scene 1: Opening (0:00–1:00)

**TUTOR:**  
Hi! Thanks for joining. Today we’re going to talk about engagement metrics — the signals that help predict whether learning is actually happening in a tutoring session. This is useful for tutors and for platforms that want to improve session quality.

**STUDENT:**  
Sounds good. What exactly do we mean by engagement?

**TUTOR:**  
Good question. Engagement isn’t just “paying attention.” Researchers usually break it into four dimensions: cognitive, behavioral, agentic, and emotional. We’ll go through each and the metrics that map to them.

---

### Scene 2: Tutor Explains — Student Stays Silent (1:00–3:30)

*[TUTOR: Speak continuously for ~2 minutes. STUDENT: Stay completely silent. This triggers the “Student has been silent” nudge after 20 seconds with Socratic preset.]*

**TUTOR:**  
Let’s start with the cognitive dimension. This is about *thinking* — how deeply the student is processing. Two key metrics here are **response latency** and **explanation length**.

Response latency is the time between when you stop speaking and when the student starts. Long pauses often mean uncertainty or confusion. Very fast answers can mean overconfidence or guessing. So latency gives you a sense of whether the student is actually thinking through the problem.

Explanation length is how long the student talks when they answer. Research shows that self-explanation improves learning — when students put ideas in their own words, they encode them better. Short yes/no answers don’t give you that signal.

The behavioral dimension is about *what the student does*. **Student talk ratio** is huge here — what fraction of the session the student is speaking. Speaking forces retrieval, organizing reasoning, and exposes misunderstandings. If the tutor is talking 90% of the time, the student isn’t practicing those skills.

**Number of attempts** matters too — how many times the student tries, restarts, or revises. That’s persistence and willingness to engage with the task.

*[Pause. Check for “Student has been silent” nudge. If it appeared, TUTOR can acknowledge it.]*

**TUTOR:**  
So those are cognitive and behavioral. Any questions so far?

---

### Scene 3: Student Responds — With Hesitation (3:30–5:00)

*[STUDENT: Take a long pause (5+ seconds) before answering. Repeat 2–3 times over the next minute to trigger “Student hesitating repeatedly.”]*

**STUDENT:**  
*[Pause 5–6 seconds.]*  
Um… so you’re saying that if I talk more, I’m more likely to learn?

**TUTOR:**  
Exactly. The act of speaking — retrieving, organizing, explaining — strengthens memory. It’s not just listening.

**STUDENT:**  
*[Pause 5–6 seconds.]*  
What about when I’m not sure? Like… I need time to think.

**TUTOR:**  
That’s where response latency helps. If you consistently take long pauses, a good tutor might rephrase the question, give more think time, or break it into smaller steps.

**STUDENT:**  
*[Pause 5–6 seconds.]*  
So… the tutor shouldn’t jump in too fast?

**TUTOR:**  
Right. Wait time matters. And that connects to the agentic dimension — student initiative. When students ask questions, that’s a strong signal. It means they’re curious and willing to seek clarification.

*[Check for “Student hesitating repeatedly” nudge.]*

---

### Scene 4: Tutor Dominates Again — Interruptions (5:00–7:00)

*[TUTOR: Talk 70%+ of the time for ~1.5 minutes to trigger “You’re doing most of the talking.” STUDENT: Start to answer; TUTOR cuts in while STUDENT is still speaking — overlap your speech for 1–2 seconds so VAD detects tutor_start_while_student_speaking. Repeat 5+ times within 2 minutes to trigger “Tutor interrupting frequently.”]*

**TUTOR:**  
The emotional dimension is about tone and sentiment. Frustration, confusion, or disengagement show up in prosody — how someone speaks — and sometimes in facial expression. Those strongly correlate with learning breakdowns.

So to summarize: we care about response latency, explanation length, student talk ratio, number of attempts, question asking, and tone. Platforms like this one can measure some of these in real time and give tutors nudges — like “student has been silent” or “you’re doing most of the talking.”

**STUDENT:**  
I was wondering about—

**TUTOR:**  
—and that’s why eye contact matters too. It’s a basic signal. If the student is looking away a lot, they might be distracted. So we track eye contact, speaking time, interruptions, and a few others.

**STUDENT:**  
But what about—

**TUTOR:**  
—the key is to balance explanation with practice. You want the student talking at least 35% of the time, ideally more.

**STUDENT:**  
So when you say interrupting—

**TUTOR:**  
—when the tutor cuts the student off, it signals that their thinking doesn’t matter. You want to avoid that.

**STUDENT:**  
So the tutor should—

**TUTOR:**  
—pause, invite responses, and give wait time. Exactly. Those are the habits that drive engagement.

*[TUTOR interrupts STUDENT 5 times total above. Each time: STUDENT must be actively speaking when TUTOR starts — overlap your speech slightly so VAD detects tutor_start_while_student_speaking.]*

*[Check for “You’re doing most of the talking” and “Tutor interrupting frequently” nudges.]*

---

### Scene 5: Balanced Discussion (7:00–8:30)

**STUDENT:**  
Okay, that makes sense. So the system is basically coaching the tutor in real time?

**TUTOR:**  
Yes. Non-intrusive nudges — things like “try asking a comprehension check” or “pause and invite the student to respond.” The goal is to improve the session while it’s happening, not just review it afterward.

**STUDENT:**  
And after the session?

**TUTOR:**  
You get a report: engagement score, talk balance, eye contact trends, flagged moments — like when nudges fired — and recommendations. For example, “The student spoke only 25% of the time. Consider more open-ended questions.”

**STUDENT:**  
So it’s feedback for the tutor, not a grade for the student.

**TUTOR:**  
Right. It’s about helping tutors improve their practice. Engagement predicts outcomes, so if we can improve engagement, we improve learning.

---

### Scene 6: Wrap-Up (8:30–10:00)

**TUTOR:**  
We’ve covered the four dimensions — cognitive, behavioral, agentic, emotional — and the metrics that map to them. The big takeaway: engagement is the strongest predictor of learning outcomes, and we can measure it. Tools like this make that measurement actionable.

**STUDENT:**  
Thanks. This was helpful.

**TUTOR:**  
Great. Let’s wrap up. *[Click **End Session** in the UI.]*

---

## Post-Session: Review the Report

After ending the session, the report page should show:

| Feature | What to verify |
|--------|----------------|
| **Key metrics** | Eye contact scores, talk time %, engagement score |
| **Participation** | Student talk ratio, tutor vs. student balance |
| **Interruptions** | Count and classification (if implemented) |
| **Trends** | Eye contact / talk time over session segments |
| **Attention cycles** | Periods of high vs. low attention |
| **Flagged moments** | Nudges that fired (student silent, tutor talk dominant, interruptions, hesitation) |
| **Recommendations** | Talk balance, eye contact, engagement suggestions |

---

## Feature Checklist

Use this to confirm all demo features were triggered:

- [ ] **Lobby** — Both joined with Tutor / Student roles
- [ ] **Session preset** — Socratic selected
- [ ] **Live metrics** — Eye contact, talk time updating in real time
- [ ] **Nudge: Student silent** — Fired during Scene 2 (~20 s silence)
- [ ] **Nudge: Tutor talk dominant** — Fired during Scene 4
- [ ] **Nudge: Student hesitating** — Fired after 3+ long pauses in Scene 3
- [ ] **Nudge: Interruptions spike** — Fired after 5+ tutor→student interruptions in Scene 4
- [ ] **Post-session report** — Summary, recommendations, flagged moments visible
- [ ] **Sensitivity** (optional) — Adjust and observe different trigger behavior

---

## Notes

- **Reading pace:** ~140 words/min. Total script ~1,400 words ≈ 10 min.
- **Nudge timing:** Socratic preset uses 20 s silence, 70% tutor talk. Default is 45 s and 85%.
- **Eye contact / attention drift:** May trigger if participants look away from camera for 30+ seconds.
- **Hesitation:** Student must pause 5+ seconds before answering, 3+ times within 2 minutes.
