import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { SessionSummary } from "@analytics-dashboard/summary";
import { SessionSummarySchema } from "@analytics-dashboard/summary-schema";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "LLM not configured" }, { status: 503 });
  }

  const client = new OpenAI({ apiKey });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = SessionSummarySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid session summary", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const summary = parsed.data as SessionSummary;

  const prompt = buildPrompt(summary);

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";

    // Parse 1–3 bullet recommendations from response
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[-•*\d.]+\s*/, "").trim())
      .filter((l) => l.length > 20);

    const recommendations = lines.slice(0, 3).map((recText) => ({
      category: "general" as const,
      text: recText,
      priority: "medium" as const,
      source: "llm" as const,
    }));

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("[recommendations] LLM error:", err);
    return NextResponse.json({ error: "LLM request failed" }, { status: 500 });
  }
}

function buildPrompt(summary: SessionSummary): string {
  const talkRatioPct = Math.round(summary.studentTalkRatio * 100);
  const tutorEyePct = Math.round(summary.avgTutorEyeContact * 100);
  const studentEyePct = Math.round(summary.avgStudentEyeContact * 100);
  const engagementPct = Math.round(summary.engagementScore * 100);
  const durationMin = Math.round(summary.durationSec / 60);

  return `You are a tutoring coach assistant. A live tutoring session just ended. Based on the metrics below, give 1–3 concise, specific, actionable recommendations to help the tutor improve future sessions. Be direct and practical. Each recommendation should be 1–2 sentences.

Session metrics:
- Duration: ${durationMin} minutes
- Student talk ratio: ${talkRatioPct}% (target ≥35%)
- Tutor eye contact: ${tutorEyePct}%
- Student eye contact: ${studentEyePct}%
- Overall engagement score: ${engagementPct}%
${summary.interruptions ? `- Interruptions: ${summary.interruptions.totalOverlaps} total (${summary.interruptions.classification.unproductive} unproductive)` : ""}

Respond with a numbered list of 1–3 recommendations only. No preamble.`;
}
