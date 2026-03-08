const CHANNEL_PREFIX = "room-status-";

function sanitizeChannelName(roomName: string): string {
  return roomName.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getRoomChannelName(roomName: string): string {
  return `${CHANNEL_PREFIX}${sanitizeChannelName(roomName)}`;
}
