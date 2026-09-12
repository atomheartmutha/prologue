import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { interviews: true } } },
  });
  return NextResponse.json(subjects);
}

export async function POST(req: NextRequest) {
  const { name, email, notes } = await req.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const subject = await prisma.subject.create({
    data: { name: name.trim(), email: email || null, notes: notes || null },
  });

  return NextResponse.json(subject, { status: 201 });
}
