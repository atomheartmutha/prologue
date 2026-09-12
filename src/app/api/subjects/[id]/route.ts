import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      interviews: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { messages: true } } },
      },
    },
  });

  if (!subject) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(subject);
}
