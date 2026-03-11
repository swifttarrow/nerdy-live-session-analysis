import type { RefObject } from "react";
import type { ParticipantRole } from "@/lib/livekit/room";
import type { SessionStatus } from "@/hooks/useSessionRoom";
import type { SessionRole } from "@/lib/roles";
import { VIDEO_RING_CLASSES, ROLE_LABELS } from "@/lib/roles";

export type VideoLayout = "side-by-side" | "focus-self" | "focus-other";

function MuteButton({
  muted,
  onToggle,
  title,
  label,
}: {
  muted: boolean;
  onToggle: () => void;
  title: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`absolute bottom-2 right-2 z-20 p-2 rounded-lg transition-colors ${
        muted
          ? "bg-red-900/70 text-red-400 hover:bg-red-800/70"
          : "bg-black/60 text-white hover:bg-black/80"
      }`}
      title={title}
      aria-label={label}
    >
      {muted ? (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
        </svg>
      )}
    </button>
  );
}

interface VideoFeedsProps {
  role: SessionRole;
  remoteRole: ParticipantRole;
  status: SessionStatus;
  hasRemoteParticipant: boolean;
  layout: VideoLayout;
  localVideoRef: RefObject<HTMLDivElement>;
  remoteVideoRef: RefObject<HTMLDivElement>;
  /** Per-video mute: local = your mic, remote = hearing the other participant */
  localMuted?: boolean;
  onToggleLocalMute?: () => void;
  remoteMuted?: boolean;
  onToggleRemoteMute?: () => void;
}

export function VideoFeeds({
  role,
  remoteRole,
  status,
  hasRemoteParticipant,
  layout,
  localVideoRef,
  remoteVideoRef,
  localMuted = false,
  onToggleLocalMute,
  remoteMuted = false,
  onToggleRemoteMute,
}: VideoFeedsProps) {
  const localRingClass =
    role === "teacher"
      ? VIDEO_RING_CLASSES.teacherLocal
      : VIDEO_RING_CLASSES.studentLocal;
  const remoteRingClass =
    role === "teacher"
      ? VIDEO_RING_CLASSES.teacherRemote
      : VIDEO_RING_CLASSES.studentRemote;

  const localLabelClass =
    role === "teacher" ? "text-amber-400" : "text-emerald-400";
  const remoteLabelClass =
    role === "teacher" ? "text-emerald-400" : "text-amber-400";

  const showLocal =
    layout === "side-by-side" || layout === "focus-self";
  const showRemote =
    layout === "side-by-side" || layout === "focus-other";

  const gridClass =
    layout === "side-by-side"
      ? "grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)] grid-rows-1"
      : "grid-cols-1 grid-rows-1";

  return (
    <div className="flex-1 flex flex-col gap-4 min-w-0 min-h-0 w-full">
      <div
        className={`grid ${gridClass} gap-4 flex-1 min-h-0 w-full`}
      >
        <div
          className={`rounded-xl overflow-hidden flex flex-col min-w-0 min-h-0 ${
            layout === "focus-self" || layout === "side-by-side" ? "flex-1" : ""
          } ${!showLocal ? "hidden" : ""} ${localRingClass}`}
        >
          <p className={`text-sm font-medium mb-2 px-1 flex-shrink-0 ${localLabelClass}`}>
            You — {ROLE_LABELS[role]}
          </p>
          <div
            className={`relative bg-gray-800 rounded-lg overflow-hidden w-full flex items-center justify-center ${
              layout === "focus-self" || layout === "side-by-side" ? "flex-1 min-h-0" : "aspect-video"
            }`}
          >
            {/* Empty container for imperative video attachment - no React children to avoid removeChild conflicts */}
            <div ref={localVideoRef} className="absolute inset-0" />
            {status !== "connected" && (
              <span className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm z-10 bg-gray-800">
                {status === "connecting" ? "Connecting..." : "Waiting..."}
              </span>
            )}
            {status === "connected" && onToggleLocalMute && (
              <MuteButton
                muted={localMuted}
                onToggle={onToggleLocalMute}
                title={localMuted ? "Unmute microphone" : "Mute microphone"}
                label={localMuted ? "Unmute microphone" : "Mute microphone"}
              />
            )}
          </div>
        </div>
        <div
          className={`rounded-xl overflow-hidden flex flex-col min-w-0 min-h-0 ${
            layout === "focus-other" || layout === "side-by-side" ? "flex-1" : ""
          } ${!showRemote ? "hidden" : ""} ${remoteRingClass}`}
        >
          <p className={`text-sm font-medium mb-2 px-1 flex-shrink-0 ${remoteLabelClass}`}>
            {ROLE_LABELS[remoteRole]}
          </p>
          <div
            className={`relative bg-gray-800 rounded-lg overflow-hidden w-full flex items-center justify-center ${
              layout === "focus-other" || layout === "side-by-side" ? "flex-1 min-h-0" : "aspect-video"
            }`}
          >
            {/* Empty container for imperative video attachment - no React children to avoid removeChild conflicts */}
            <div ref={remoteVideoRef} className="absolute inset-0" />
            {status === "connected" && !hasRemoteParticipant && (
              <span className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm z-10 bg-gray-800">
                Waiting for {ROLE_LABELS[remoteRole].toLowerCase()}…
              </span>
            )}
            {status === "connected" &&
              hasRemoteParticipant &&
              onToggleRemoteMute && (
                <MuteButton
                  muted={remoteMuted}
                  onToggle={onToggleRemoteMute}
                  title={
                    remoteMuted
                      ? `Unmute ${ROLE_LABELS[remoteRole]}`
                      : `Mute ${ROLE_LABELS[remoteRole]}`
                  }
                  label={
                    remoteMuted
                      ? `Unmute ${ROLE_LABELS[remoteRole]}` : `Mute ${ROLE_LABELS[remoteRole]}`
                  }
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
