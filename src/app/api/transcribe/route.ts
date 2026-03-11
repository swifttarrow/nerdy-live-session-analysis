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

  let file: File | Blob;
  try {
    const formData = await req.formData();
    const f = formData.get("file");
    if (!f || !(f instanceof Blob)) {
      return NextResponse.json(
        { error: "No audio file provided", received: f ? typeof f : "null" },
        { status: 400 }
      );
    }
    // Use Blob as-is (Node 18 lacks global File; OpenAI accepts Blob)
    file = f;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[transcribe] formData parse error:", msg, err);
    return NextResponse.json(
      { error: "Invalid request body", detail: msg },
      { status: 400 }
    );
  }

  // Skip very small files (likely silence or noise)
  if (file.size < 1000) {
    return NextResponse.json({ text: "" });
  }

  const client = new OpenAI({ apiKey });

  // OpenAI SDK expects File-like (name, lastModified); Blob lacks these
  const fileForUpload =
    file instanceof File
      ? file
      : new File([file], "audio.webm", { type: file.type || "audio/webm" });

  try {
    const transcription = await client.audio.transcriptions.create({
      file: fileForUpload,
      model: "whisper-1",
      response_format: "text",
      language: "en",
    });

    const text = (typeof transcription === "string" ? transcription : "").trim();

    return NextResponse.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[transcribe] Whisper error:", msg, err);
    return NextResponse.json(
      { error: "Transcription failed", detail: msg },
      { status: 500 }
    );
  }
}
