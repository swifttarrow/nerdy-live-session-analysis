import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get("room");

  if (!room) {
    return NextResponse.json(
      { error: "Missing required param: room" },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !livekitUrl) {
    return NextResponse.json(
      { error: "LiveKit credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const host = livekitUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
    const roomService = new RoomServiceClient(host, apiKey, apiSecret);
    let hasTeacher = false;
    let hasStudent = false;
    try {
      const participants = await roomService.listParticipants(room);
      for (const p of participants) {
        try {
          const meta = p.metadata ? JSON.parse(p.metadata) : {};
          if (meta.role === "teacher") hasTeacher = true;
          else if (meta.role === "student") hasStudent = true;
          else {
            // Legacy: no metadata — first = teacher, second = student
            if (!hasTeacher) hasTeacher = true;
            else if (!hasStudent) hasStudent = true;
          }
        } catch {
          if (!hasTeacher) hasTeacher = true;
          else if (!hasStudent) hasStudent = true;
        }
      }
    } catch {
      // Room may not exist yet; treat as empty
    }
    const participantCount = (hasTeacher ? 1 : 0) + (hasStudent ? 1 : 0);
    return NextResponse.json({
      participantCount,
      hasTeacher,
      hasStudent,
    });
  } catch (err) {
    console.error("Room status check failed:", err);
    return NextResponse.json(
      { error: "Failed to check room status" },
      { status: 500 }
    );
  }
}
