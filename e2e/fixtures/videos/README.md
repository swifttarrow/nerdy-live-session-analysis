# Test Video Fixtures

Place two video files here for the debug path E2E tests:

- **tutor.mp4** or **tutor.webm** — Teacher/tutor video (face visible, with audio for talk-time)
- **student.mp4** or **student.webm** — Student video (face visible, with audio for talk-time)

## Requirements

- Format: MP4 or WebM (video/*)
- Duration: Short clips (e.g. 30–90 seconds) recommended. The test waits for both videos to finish; set `E2E_VIDEO_DURATION_SEC` if longer (e.g. `E2E_VIDEO_DURATION_SEC=120 npm run test:e2e`)
- Both videos should have:
  - A clear, front-facing face for eye contact detection (MediaPipe)
  - An audio track for talk-time detection (Silero VAD)

## Creating test videos

You can record short clips with your webcam or use existing footage. Ensure both files are named exactly `tutor.mp4` and `student.mp4`.
