import type { RefObject } from "react";
import type { ParticipantRole } from "@/lib/livekit/room";
import type { SessionStatus } from "@/hooks/useSessionRoom";

type SessionRole = "teacher" | "student";

interface VideoFeedsProps {
  role: SessionRole;
  remoteRole: ParticipantRole;
  status: SessionStatus;
  localVideoRef: RefObject<HTMLDivElement>;
  remoteVideoRef: RefObject<HTMLDivElement>;
}

export function VideoFeeds({
  role,
  remoteRole,
  status,
  localVideoRef,
  remoteVideoRef,
}: VideoFeedsProps) {
  const localRingClass =
    role === "teacher"
      ? "ring-2 ring-amber-500/50 ring-offset-2 ring-offset-gray-950"
      : "ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-gray-950";
  const remoteRingClass =
    role === "teacher"
      ? "ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-gray-950"
      : "ring-2 ring-amber-500/30 ring-offset-2 ring-offset-gray-950";

  const localLabelClass =
    role === "teacher" ? "text-amber-400" : "text-emerald-400";
  const remoteLabelClass =
    role === "teacher" ? "text-emerald-400" : "text-amber-400";

  return (
    <div className="flex-1 grid grid-cols-2 gap-4">
      <div className={`rounded-xl overflow-hidden ${localRingClass}`}>
        <p className={`text-sm font-medium mb-2 px-1 ${localLabelClass}`}>
          You — {role === "teacher" ? "Teacher" : "Student"}
        </p>
        <div
          ref={localVideoRef}
          className="bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center"
        >
          {status !== "connected" && (
            <span className="text-gray-500 text-sm">
              {status === "connecting" ? "Connecting..." : "Waiting..."}
            </span>
          )}
        </div>
      </div>
      <div className={`rounded-xl overflow-hidden ${remoteRingClass}`}>
        <p className={`text-sm font-medium mb-2 px-1 ${remoteLabelClass}`}>
          {remoteRole === "tutor" ? "Teacher" : "Student"}
        </p>
        <div
          ref={remoteVideoRef}
          className="bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center"
        >
          {status === "connected" && (
            <span className="text-gray-500 text-sm">
              Waiting for {remoteRole === "tutor" ? "teacher" : "student"}…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
