import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const interviews = await prisma.interview.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  return NextResponse.json(interviews);
}

export async function POST(req: NextRequest) {
  const { topic, goal } = await req.json();

  if (!topic || !goal) {
    return NextResponse.json({ error: "topic and goal are required" }, { status: 400 });
  }

  const interview = await prisma.interview.create({
    data: { topic, goal },
  });

  return NextResponse.json(interview, { status: 201 });
}
