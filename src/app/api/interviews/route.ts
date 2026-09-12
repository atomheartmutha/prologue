import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const interviews = await prisma.interview.findMany({
    where: q
      ? {
          OR: [
            { topic: { contains: q, mode: "insensitive" } },
            { goal: { contains: q, mode: "insensitive" } },
            { subject: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      subject: true,
      _count: { select: { messages: true } },
    },
  });
  return NextResponse.json(interviews);
}

export async function POST(req: NextRequest) {
  const { topic, goal, subjectId, subjectName } = await req.json();

  if (!topic || !goal) {
    return NextResponse.json({ error: "topic and goal are required" }, { status: 400 });
  }

  let resolvedSubjectId: string | undefined = subjectId || undefined;

  if (!resolvedSubjectId && subjectName?.trim()) {
    const subject = await prisma.subject.create({
      data: { name: subjectName.trim() },
    });
    resolvedSubjectId = subject.id;
  }

  const interview = await prisma.interview.create({
    data: { topic, goal, subjectId: resolvedSubjectId },
  });

  return NextResponse.json(interview, { status: 201 });
}
