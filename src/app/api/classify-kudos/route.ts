import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const ClassifyRequestSchema = z.object({
  text: z.string().min(1).max(2000),
});

const CLASSIFY_SYSTEM = `You classify tutor speech for Socratic teaching kudos. Return JSON only.

open_ended_question: true if the tutor asks an open-ended probing question that invites the student to explain, elaborate, or think deeper (e.g. "Why do you think that?", "Tell me more", "What's your reasoning?", "Could you elaborate?", "What led you to that conclusion?"). False for closed yes/no questions, simple factual questions, or rhetorical questions that don't expect a substantive answer (e.g. "Isn't that right?", "Does that make sense?", "See what I mean?").

hypothetical_scenario: true if the tutor poses a hypothetical, counterfactual, or "what if" scenario to challenge the student to apply thinking (e.g. "What if we doubled it?", "Suppose you were in a different situation", "Imagine that...", "Consider a scenario where..."). False otherwise.

Return only valid JSON: {"open_ended_question": boolean, "hypothetical_scenario": boolean}`;

/**
 * POST /api/classify-kudos
 * Classifies tutor transcript for Socratic kudos using gpt-4.1-nano.
 * Body: { text: string }
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Classification not configured (missing OPENAI_API_KEY)" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = ClassifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request: text required (1-2000 chars)" },
      { status: 400 }
    );
  }

  const { text } = parsed.data;
  const trimmed = text.trim();
  if (trimmed.length < 5) {
    return NextResponse.json({
      open_ended_question: false,
      hypothetical_scenario: false,
    });
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: CLASSIFY_SYSTEM },
        { role: "user", content: trimmed },
      ],
      max_tokens: 50,
      temperature: 0,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const json = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    const result = JSON.parse(json) as {
      open_ended_question?: boolean;
      hypothetical_scenario?: boolean;
    };

    return NextResponse.json({
      open_ended_question: Boolean(result.open_ended_question),
      hypothetical_scenario: Boolean(result.hypothetical_scenario),
    });
  } catch (err) {
    console.error("[classify-kudos] Error:", err);
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    );
  }
}
