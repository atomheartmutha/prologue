import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInterviewerReply, TranscriptMessage } from "@/lib/anthropic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { content } = await req.json();

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!interview) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (interview.status !== "active") {
    return NextResponse.json({ error: "interview is not active" }, { status: 400 });
  }

  if (content) {
    await prisma.message.create({
      data: { interviewId: id, role: "subject", content },
    });
  }

  const transcript: TranscriptMessage[] = [
    ...interview.messages.map((m) => ({
      role: m.role as "assistant" | "subject",
      content: m.content,
    })),
    ...(content ? [{ role: "subject" as const, content }] : []),
  ];

  const reply = await generateInterviewerReply(interview.topic, interview.goal, transcript);

  const saved = await prisma.message.create({
    data: { interviewId: id, role: "assistant", content: reply },
  });

  return NextResponse.json(saved);
}
