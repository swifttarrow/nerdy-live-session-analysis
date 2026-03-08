import { NextRequest, NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { RoomServiceClient } from "livekit-server-sdk";
import { triggerRoomParticipantUpdate } from "@/lib/pusher";

const PARTICIPANT_EVENTS = ["participant_joined", "participant_left"] as const;

export async function POST(request: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit credentials not configured" },
      { status: 500 }
    );
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const authHeader = request.headers.get("Authorization") ?? undefined;
  const receiver = new WebhookReceiver(apiKey, apiSecret);

  let event;
  try {
    event = await receiver.receive(body, authHeader);
  } catch (err) {
    console.error("Webhook validation failed:", err);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }

  if (!PARTICIPANT_EVENTS.includes(event.event as (typeof PARTICIPANT_EVENTS)[number])) {
    return NextResponse.json({ ok: true });
  }

  const roomName = event.room?.name;
  if (!roomName) {
    return NextResponse.json({ ok: true });
  }

  // ACK fast, process async (LiveKit best practice)
  const response = NextResponse.json({ ok: true });

  // Process async: get current roles and push to clients
  (async () => {
    try {
      const host = (livekitUrl ?? "").replace(/^wss:/, "https:").replace(/^ws:/, "http:");
      const roomService = new RoomServiceClient(host, apiKey, apiSecret);
      const participants = await roomService.listParticipants(roomName);
      let hasTeacher = false;
      let hasStudent = false;
      for (const p of participants) {
        try {
          const meta = p.metadata ? JSON.parse(p.metadata) : {};
          if (meta.role === "teacher") hasTeacher = true;
          else if (meta.role === "student") hasStudent = true;
          else {
            if (!hasTeacher) hasTeacher = true;
            else if (!hasStudent) hasStudent = true;
          }
        } catch {
          if (!hasTeacher) hasTeacher = true;
          else if (!hasStudent) hasStudent = true;
        }
      }
      const participantCount = (hasTeacher ? 1 : 0) + (hasStudent ? 1 : 0);
      triggerRoomParticipantUpdate(roomName, {
        participantCount,
        hasTeacher,
        hasStudent,
      });
    } catch (err) {
      console.error("Webhook async processing failed:", err);
    }
  })();

  return response;
}
