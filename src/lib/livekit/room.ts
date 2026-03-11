import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  LocalParticipant,
  ConnectionState,
} from "livekit-client";

export type ParticipantRole = "tutor" | "student";

export interface TrackAttachment {
  role: ParticipantRole;
  element: HTMLVideoElement | HTMLAudioElement;
  track: Track;
}

export interface RoomConnectionCallbacks {
  onLocalVideoTrack?: (element: HTMLVideoElement) => void;
  onRemoteVideoTrack?: (element: HTMLVideoElement) => void;
  onLocalAudioTrack?: (stream: MediaStream) => void;
  onRemoteAudioTrack?: (stream: MediaStream) => void;
  /** Called with the audio element used for remote playback; mute this element for per-video mute */
  onRemoteAudioPlaybackReady?: (element: HTMLAudioElement) => void;
  onRemoteDisconnect?: () => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

/**
 * Creates and connects a LiveKit room.
 * Local participant = tutor; first remote participant = student.
 */
export async function connectToRoom(
  url: string,
  token: string,
  callbacks: RoomConnectionCallbacks
): Promise<Room> {
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
    },
  });

  room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
    callbacks.onConnectionStateChange?.(state);
  });

  // Handle remote tracks when subscribed
  room.on(
    RoomEvent.TrackSubscribed,
    (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      void participant; // student
      if (track.kind === Track.Kind.Video) {
        const el = track.attach() as HTMLVideoElement;
        el.autoplay = true;
        el.playsInline = true;
        callbacks.onRemoteVideoTrack?.(el);
      } else if (track.kind === Track.Kind.Audio) {
        const mediaStream = new MediaStream([track.mediaStreamTrack]);
        callbacks.onRemoteAudioTrack?.(mediaStream);
        // Create our own playback element so we can mute it (per-video mute)
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.srcObject = mediaStream;
        void audioEl.play().catch(() => {});
        callbacks.onRemoteAudioPlaybackReady?.(audioEl);
      }
    }
  );

  room.on(
    RoomEvent.TrackUnsubscribed,
    (_track: RemoteTrack, _pub: RemoteTrackPublication, _p: RemoteParticipant) => {
      callbacks.onRemoteDisconnect?.();
    }
  );

  room.on(RoomEvent.ParticipantDisconnected, () => {
    callbacks.onRemoteDisconnect?.();
  });

  await room.connect(url, token);

  // Enable local camera + mic
  await room.localParticipant.enableCameraAndMicrophone();

  // Attach local video
  const localVideoTrack = getLocalVideoTrack(room.localParticipant);
  if (localVideoTrack) {
    const el = localVideoTrack.attach() as HTMLVideoElement;
    el.autoplay = true;
    el.playsInline = true;
    el.muted = true; // mute local video element to avoid echo
    callbacks.onLocalVideoTrack?.(el);
  }

  // Expose local audio stream for VAD
  const localAudioTrack = getLocalAudioTrack(room.localParticipant);
  if (localAudioTrack) {
    const mediaStream = new MediaStream([localAudioTrack.mediaStreamTrack]);
    callbacks.onLocalAudioTrack?.(mediaStream);
  }

  return room;
}

function getLocalVideoTrack(participant: LocalParticipant) {
  for (const pub of participant.videoTrackPublications.values()) {
    if (pub.track && pub.track.kind === Track.Kind.Video) {
      return pub.track;
    }
  }
  return null;
}

function getLocalAudioTrack(participant: LocalParticipant) {
  for (const pub of participant.audioTrackPublications.values()) {
    if (pub.track && pub.track.kind === Track.Kind.Audio) {
      return pub.track;
    }
  }
  return null;
}

export async function disconnectRoom(room: Room): Promise<void> {
  await room.disconnect();
}
