import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAnalysis, TranscriptMessage } from "@/lib/anthropic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!interview) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const transcript: TranscriptMessage[] = interview.messages.map((m) => ({
    role: m.role as "assistant" | "subject",
    content: m.content,
  }));

  const analysis = await generateAnalysis(interview.topic, interview.goal, transcript);

  const updated = await prisma.interview.update({
    where: { id },
    data: { status: "completed", analysis: JSON.stringify(analysis) },
  });

  return NextResponse.json(updated);
}
