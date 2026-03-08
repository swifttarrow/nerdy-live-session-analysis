/**
 * Session context: defines channel/track mapping for tutor vs student.
 */
export type AudioMode = "dual-track" | "single-mic";

export interface SessionContext {
  audioMode: AudioMode;
  tutorIdentity: string;
  studentIdentity: string;
}

/**
 * Default session context: dual-track (LiveKit gives each participant their own track).
 */
export function createSessionContext(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    audioMode: "dual-track",
    tutorIdentity: "tutor",
    studentIdentity: "student",
    ...overrides,
  };
}
