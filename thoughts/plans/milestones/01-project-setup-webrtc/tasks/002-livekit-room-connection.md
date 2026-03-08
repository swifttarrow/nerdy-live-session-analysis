# Task 002: LiveKit Room Connection

## Goal

Implement LiveKit room connection logic so tutor and student can create/join a session with distinct identities.

## Deliverables

- [ ] `src/lib/livekit/` or `src/lib/webrtc/` — room connection module
- [ ] Create/join LiveKit room with tutor and student identities
- [ ] Attach local and remote video tracks to `<video>` elements
- [ ] Role assignment: local participant = tutor (or configurable); remote = student

## Notes

- Each participant publishes their own video; analysis client receives both local + remote streams
- `getUserMedia` alone cannot access remote participant's video — WebRTC/LiveKit required
- Handle room disconnect gracefully

## Verification

- Two browser tabs can join same room
- Both see each other's video
- Video elements receive correct tracks (local vs remote)
