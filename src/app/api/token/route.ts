import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { HTTP_STATUS, DEFAULTS } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get("room");
  const identity = searchParams.get("identity");
  const role = searchParams.get("role") === "student" ? "student" : "teacher";

  if (!room || !identity) {
    return NextResponse.json(
      { error: "Missing required params: room, identity" },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit credentials not configured" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      ttl: DEFAULTS.TOKEN_TTL,
      metadata: JSON.stringify({ role }),
    });
    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    return NextResponse.json({ token });
  } catch (err) {
    console.error("Token generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
