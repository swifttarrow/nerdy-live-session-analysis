import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST /api/kudos/probe-assumptions
 * Uses LLM to check if tutor transcript probes student assumptions/beliefs.
 * Body: { transcript: string }
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "LLM not configured (missing OPENAI_API_KEY)" },
      { status: 503 }
    );
  }

  let body: { transcript?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    return NextResponse.json({ probes: false });
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 10,
      messages: [
        {
          role: "system",
          content: `You are evaluating tutoring dialogue. Does the tutor's statement probe the student's assumptions, beliefs, or reasoning? 
Examples of probing: challenging initial answers, asking "what makes you think that?", uncovering contradictions, exploring the reasoning behind an answer.
Reply with exactly "yes" or "no".`,
        },
        {
          role: "user",
          content: `Tutor said: "${transcript}"`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim().toLowerCase() ?? "";
    const probes = text.startsWith("yes");

    return NextResponse.json({ probes });
  } catch (err) {
    console.error("[kudos/probe-assumptions] LLM error:", err);
    return NextResponse.json(
      { error: "Check failed" },
      { status: 500 }
    );
  }
}
