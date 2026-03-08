import Pusher from "pusher";

let pusher: Pusher | null = null;

function getPusher(): Pusher | null {
  if (pusher) return pusher;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER ?? "us2";
  if (!appId || !key || !secret) return null;
  pusher = new Pusher({ appId, key, secret, cluster });
  return pusher;
}

import { getRoomChannelName } from "./room-channel";

export function triggerRoomParticipantUpdate(
  roomName: string,
  payload: { participantCount: number; hasTeacher: boolean; hasStudent: boolean }
): boolean {
  const p = getPusher();
  if (!p) return false;
  const channel = getRoomChannelName(roomName);
  p.trigger(channel, "participant-update", payload);
  return true;
}
