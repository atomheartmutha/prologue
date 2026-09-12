import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Analysis } from "@/lib/anthropic";

export async function GET() {
  const interviews = await prisma.interview.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      subject: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  const lines: string[] = [];

  lines.push("PROLOGUE — FULL DATA EXPORT");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Total interviews: ${interviews.length}`);
  lines.push(
    "This file contains every interview, subject, transcript, and analysis in this Prologue project, in plain text for an AI or human to read end to end."
  );
  lines.push("=".repeat(80));

  for (const interview of interviews) {
    const analysis: Analysis | null = interview.analysis
      ? JSON.parse(interview.analysis)
      : null;

    lines.push("");
    lines.push("-".repeat(80));
    lines.push(`INTERVIEW: ${interview.topic}`);
    lines.push(`ID: ${interview.id}`);
    lines.push(`Status: ${interview.status}`);
    lines.push(`Created: ${interview.createdAt.toISOString()}`);
    lines.push(`Subject: ${interview.subject ? interview.subject.name : "(none)"}`);
    if (interview.subject?.email) lines.push(`Subject email: ${interview.subject.email}`);
    if (interview.subject?.notes) lines.push(`Subject notes: ${interview.subject.notes}`);
    lines.push(`Goal: ${interview.goal}`);
    lines.push("");

    lines.push("TRANSCRIPT:");
    if (interview.messages.length === 0) {
      lines.push("(no messages yet)");
    } else {
      for (const m of interview.messages) {
        lines.push(`${m.role === "assistant" ? "Interviewer" : "Participant"}: ${m.content}`);
      }
    }

    if (analysis) {
      lines.push("");
      lines.push("ANALYSIS SUMMARY:");
      lines.push(analysis.summary);

      if (analysis.themes?.length) {
        lines.push("");
        lines.push("THEMES:");
        for (const t of analysis.themes) {
          lines.push(`- ${t.title}: ${t.description}`);
        }
      }

      if (analysis.quotes?.length) {
        lines.push("");
        lines.push("NOTABLE QUOTES:");
        for (const q of analysis.quotes) {
          lines.push(`- "${q.quote}" — ${q.context}`);
        }
      }
    } else {
      lines.push("");
      lines.push("ANALYSIS: (not generated yet — interview still active)");
    }
  }

  const body = lines.join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="prologue-export.txt"',
    },
  });
}
