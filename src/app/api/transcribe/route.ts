import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST /api/transcribe
 * Transcribes audio using Whisper API.
 * Body: multipart/form-data with "file" (audio blob: webm, wav, mp3, etc.)
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Transcription not configured (missing OPENAI_API_KEY)" },
      { status: 503 }
    );
  }

  let file: File;
  try {
    const formData = await req.formData();
    const f = formData.get("file");
    if (!f || !(f instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }
    file = f;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Skip very small files (likely silence or noise)
  if (file.size < 1000) {
    return NextResponse.json({ text: "" });
  }

  const client = new OpenAI({ apiKey });

  try {
    const transcription = await client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "text",
      language: "en",
    });

    const text = (typeof transcription === "string" ? transcription : "").trim();

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[transcribe] Whisper error:", err);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
