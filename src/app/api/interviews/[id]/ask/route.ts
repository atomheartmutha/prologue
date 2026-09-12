import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { askBackboard } from "@/lib/backboard";
import type { Analysis } from "@/lib/anthropic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { question } = await req.json();

  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!interview) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    let prompt = question;

    if (!interview.backboardThreadId) {
      const transcript = interview.messages
        .map((m) => `${m.role === "assistant" ? "Interviewer" : "Participant"}: ${m.content}`)
        .join("\n");
      const analysis: Analysis | null = interview.analysis
        ? JSON.parse(interview.analysis)
        : null;

      prompt = `You are helping a UX researcher review one interview. Answer questions grounded only in the transcript and analysis below. Be concise.

Topic: ${interview.topic}
Goal: ${interview.goal}

Transcript:
${transcript}

${analysis ? `Analysis summary: ${analysis.summary}` : ""}

The researcher's first question: ${question}`;
    }

    const { content, threadId } = await askBackboard(prompt, interview.backboardThreadId);

    if (!interview.backboardThreadId) {
      await prisma.interview.update({
        where: { id },
        data: { backboardThreadId: threadId },
      });
    }

    return NextResponse.json({ answer: content });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Backboard request failed" }, { status: 502 });
  }
}
