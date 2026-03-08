# FAQ — Technical Terms & Concepts

Definitions and comparisons for terms used in the SessionLens architecture research.

---

## Audio & Speech Processing

### What is VAD?

**VAD (Voice Activity Detection)** is a signal-processing technique that detects whether human speech is present in an audio stream at any given moment. It answers: *"Is someone speaking right now?"*

- **Output:** Binary (speech / no speech) or a confidence score (speech presence probability)
- **Role:** Foundation for speech recognition, diarization, and talk-time metrics
- **Challenges:** Distinguishing speech from background noise, music, coughing, HVAC, etc.
- **In this project:** Used to segment audio before diarization and to compute talk-time percentages (e.g., Silero VAD in the browser)

---

### What is diarization?

**Diarization** (speaker diarization) is the process of partitioning an audio stream into segments and labeling *who spoke when*. It answers: *"Who said what, and when?"*

- **Output:** Timestamped segments with speaker labels (e.g., "Speaker A", "Speaker B", or "Tutor", "Student")
- **Components:** Speaker segmentation (when speakers change) + speaker clustering (grouping segments by speaker)
- **In this project:** Needed to separate tutor vs student talk time and measure speaking balance (e.g., Whisper with diarization, pyannote, or channel-based when stereo)

---

### What is Vosk?

**Vosk** is an open-source, offline speech recognition toolkit. It runs entirely on-device with no internet required.

- **Features:** 20+ languages, lightweight models (~50MB per language), streaming API for low latency
- **Platforms:** Linux, Windows, macOS, Android, iOS; Python, Java, JS, C++, etc.
- **In this project:** Option for fully local transcription and diarization when cloud APIs are not desired (lower cost, more privacy, but may need more tuning for accuracy)

---

### What is Whisper?

**Whisper** is OpenAI’s automatic speech recognition (ASR) system. It transcribes and optionally translates audio, with strong robustness to accents, noise, and technical language.

- **Features:** Multilingual, phrase-level timestamps, language detection, optional diarization (e.g., `gpt-4o-transcribe-diarize`)
- **Availability:** Open-source models + OpenAI API (~$0.006/min)
- **In this project:** Recommended for high-accuracy transcription and diarization when cloud is acceptable; used in server-side and hybrid architectures

---

### What is meant by cloud vision or cloud transcription?

**Cloud vision** and **cloud transcription** mean using hosted APIs (e.g., Google, AWS, OpenAI) instead of running models locally.

| Term | Meaning | Examples |
|------|---------|----------|
| **Cloud vision** | Send images/frames to a remote API; receive labels, faces, gaze, etc. | Google Cloud Vision, AWS Rekognition |
| **Cloud transcription** | Send audio to a remote API; receive text and optionally speaker labels | Google Speech-to-Text, OpenAI Whisper API, AWS Transcribe |

- **Pros:** High accuracy, no local compute, easy to integrate
- **Cons:** Latency (network round-trip), cost per request, privacy (data leaves the device)
- **In this project:** Architecture research favors browser-side processing to avoid cloud round-trips for latency; cloud used mainly for post-session LLM summarization

---

## Computer Vision

### What is MediaPipe?

**MediaPipe** is Google’s open-source framework for building cross-platform ML solutions for live and streaming media. It focuses on on-device inference (browser, mobile, edge).

- **Features:** Pre-built solutions (face/pose/hand detection, gaze, etc.), WebAssembly for browsers, low latency
- **In this project:** MediaPipe Face Landmarker used for face detection, landmarks, and gaze estimation in the browser; achieves ~85–91% gaze accuracy and &lt;50 ms latency

---

### What is OpenCV?

**OpenCV (Open Source Computer Vision Library)** is an open-source library of hundreds of computer vision algorithms. It is widely used for image/video processing, object detection, and camera calibration.

- **Features:** Image processing, video analysis, face/object detection, 2D features, GPU support (CUDA, OpenCL)
- **Platforms:** C++, Python, Java; Windows, Linux, macOS, Android, iOS
- **In this project:** Alternative to MediaPipe for server-side face/gaze when running Python on the server (e.g., Architecture B)

---

## Real-Time Transport

### What is WebRTC?

**WebRTC (Web Real-Time Communication)** is a standard that enables real-time audio, video, and data between browsers and apps without plugins.

- **Transport:** Uses UDP (RTP) by default for media; can fall back to TCP if UDP is blocked
- **Architecture:** Peer-to-peer; servers used mainly for signaling and NAT traversal (STUN/TURN)
- **Use cases:** Video calls, screen sharing, low-latency media streaming
- **In this project:** Preferred for sub-500 ms latency when streaming video/audio to a server; requires UDP support from the deployment provider

---

### What difference does using WebRTC vs WebSocket make?

| Aspect | WebRTC | WebSocket |
|--------|--------|-----------|
| **Transport** | UDP (RTP) by default | TCP |
| **Latency** | ~100–300 ms for video | Higher (data goes through server) |
| **Architecture** | Peer-to-peer media | Client–server |
| **Media handling** | Built for audio/video, A/V sync | General messaging; media must be chunked (e.g., MediaRecorder) |
| **Deployment** | Needs UDP and TURN | Works on any TCP host (e.g., Railway) |

**In this project:** WebSocket + MediaRecorder is recommended for MVP on Railway (no inbound UDP). WebRTC is preferred for production when UDP is available (e.g., Fly.io, LiveKit).

---

## Networking & Protocols

### What is TCP?

**TCP (Transmission Control Protocol)** is a connection-oriented transport protocol that guarantees reliable, ordered delivery of data.

- **Reliability:** Retransmits lost packets; receiver acknowledges receipt
- **Ordering:** Packets arrive in the order sent
- **Trade-off:** Higher latency and overhead than UDP; not ideal for real-time media where late data is useless
- **Use cases:** Web pages, file transfer, WebSocket, most HTTP traffic

---

### What is UDP?

**UDP (User Datagram Protocol)** is a connectionless transport protocol that sends packets without guarantees.

- **Characteristics:** No retransmission, no ordering guarantee, minimal overhead
- **Trade-off:** Lower latency; some packets may be lost or arrive out of order
- **Use cases:** Real-time media (video, voice), gaming, live streaming—where speed matters more than perfect delivery
- **In this project:** WebRTC uses UDP for media; Railway blocks inbound UDP, which limits WebRTC deployment there

---

### What is RTP?

**RTP (Real-time Transport Protocol)** is a protocol for delivering audio and video over IP networks. It typically runs over UDP.

- **Purpose:** Timestamps, sequence numbers, and payload type identification for real-time media
- **Pairing:** Often used with RTCP (RTP Control Protocol) for quality feedback
- **In this project:** WebRTC uses RTP for media delivery; RTP packets are carried inside UDP

---

### What is NAT traversal?

**NAT traversal** is the set of techniques used to establish connections between devices that sit behind NAT (Network Address Translation)—e.g., home routers that share one public IP among many devices.

- **Problem:** A device behind NAT has a private IP; peers on the internet cannot initiate connections to it directly
- **Solution:** STUN discovers the device’s public address; TURN relays traffic when direct connection fails
- **In this project:** WebRTC needs NAT traversal (ICE, STUN, TURN) to connect peers; TURN servers require inbound UDP, which Railway does not support

---

### What is STUN and TURN?

**STUN (Session Traversal Utilities for NAT)** and **TURN (Traversal Using Relays around NAT)** are protocols that help peers connect through NAT and firewalls.

| Protocol | Role |
|----------|------|
| **STUN** | Helps a client discover its public IP and port; used for direct peer-to-peer connections when possible |
| **TURN** | Relays media when direct connection fails (symmetric NAT, strict firewalls); acts as a fallback server |

- **Flow:** Try direct connection → if it fails, use TURN to relay traffic through a server
- **Cost:** TURN uses server bandwidth and CPU; STUN is lightweight
- **In this project:** WebRTC uses both; TURN needs a server that accepts inbound UDP—Railway blocks this, Fly.io allows it

---

### Why would UDP be blocked?

UDP is often blocked or restricted for several reasons:

- **Security:** UDP is harder to inspect and filter than TCP; some firewalls block it by default
- **Abuse:** Used in amplification attacks (DNS, NTP); providers may restrict it to reduce risk
- **Policy:** Corporate or institutional networks may allow only HTTP/HTTPS (TCP)
- **Platform limits:** Some hosting providers (e.g., Railway) do not support inbound UDP for architectural or operational reasons
- **Result:** WebRTC falls back to TCP when UDP is blocked, which increases latency and can degrade real-time media quality

---

## Deployment

### Does using Railway vs Fly.io vs another provider make a difference?

Yes, especially for real-time media and WebRTC.

| Provider | UDP support | WebRTC | Notes |
|----------|-------------|--------|-------|
| **Railway** | No inbound UDP | Limited | Easy deploy; blocks WebRTC TURN; fine for browser-only or WebSocket + MediaRecorder |
| **Fly.io** | Full UDP | Yes | Global regions, Docker deploy; suitable for WebRTC and LiveKit |
| **Vercel** | Serverless | No | Not for long-lived media; use a separate worker elsewhere |
| **LiveKit Cloud** | Managed | Yes | Managed WebRTC; no self-hosted UDP setup |

**In this project:**  
- **Browser-first (no video upload):** Railway is fine; WebRTC not required.  
- **Server-side video/audio:** Fly.io or LiveKit Cloud recommended; Railway is unsuitable for WebRTC due to no inbound UDP.

---

## Tutoring & Pedagogy

### What is the Socratic method?

**The Socratic method** is a teaching approach in which the tutor guides the student to discover answers through a series of questions rather than explaining the solution directly. The tutor acts as a facilitator, not a lecturer.

- **Core idea:** Students learn by reasoning through problems; the tutor asks questions that prompt thinking, surface misconceptions, and lead the student to derive the answer.
- **Example prompts:** "What do you notice?" / "What's the goal of this step?" / "What happens if we remove this?" / "Where do you think it went wrong?"
- **Contrast:** Instead of "Here's how to solve it," the tutor asks "What do you think the next step should be?"
- **In this project:** Referenced in the post-session feedback design as a technique to suggest when tutors give answers instead of guiding; part of the technique library for LLM-generated alternatives

---

## References

- [Architecture Research](./architecture-research.md)
- [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js)
- [Silero VAD](https://github.com/snakers4/silero-vad)
- [Vosk](https://alphacephei.com/vosk/)
- [OpenAI Whisper](https://openai.com/research/whisper)
- [WebRTC](https://webrtc.org/)
- [Railway UDP limitations](https://station.railway.com/questions/does-railway-allow-external-udp-traffic-e36d0dc8)
