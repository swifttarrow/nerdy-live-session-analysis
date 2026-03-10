/**
 * Role constants and mappings between session UI roles and LiveKit participant roles.
 */

export type SessionRole = "teacher" | "student";
export type ParticipantRole = "tutor" | "student";

export const SESSION_ROLE = {
  TEACHER: "teacher",
  STUDENT: "student",
} as const satisfies Record<string, SessionRole>;

export const PARTICIPANT_ROLE = {
  TUTOR: "tutor",
  STUDENT: "student",
} as const satisfies Record<string, ParticipantRole>;

/** Map session role (UI) to LiveKit participant role */
export function sessionRoleToParticipantRole(
  role: SessionRole
): ParticipantRole {
  return role === SESSION_ROLE.TEACHER ? PARTICIPANT_ROLE.TUTOR : PARTICIPANT_ROLE.STUDENT;
}

/** Display labels for roles */
export const ROLE_LABELS: Record<SessionRole | ParticipantRole, string> = {
  teacher: "Teacher",
  student: "Student",
  tutor: "Teacher",
};

/** Ring/active styling for video feeds by role */
export const VIDEO_RING_CLASSES = {
  teacherLocal: "ring-2 ring-amber-500/50 ring-offset-2 ring-offset-gray-950",
  teacherRemote: "ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-gray-950",
  studentLocal: "ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-gray-950",
  studentRemote: "ring-2 ring-amber-500/30 ring-offset-2 ring-offset-gray-950",
} as const;
