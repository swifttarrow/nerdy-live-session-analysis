import { NextRequest, NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

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

  try {
    await receiver.receive(body, authHeader);
  } catch (err) {
    console.error("Webhook validation failed:", err);
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
