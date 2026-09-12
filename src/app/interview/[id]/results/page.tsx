import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Analysis } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } }, subject: true },
  });

  if (!interview) notFound();

  const analysis: Analysis | null = interview.analysis
    ? JSON.parse(interview.analysis)
    : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Link href="/" className="mb-6 inline-block text-sm font-bold text-purple hover:underline">
        &larr; Back to all interviews
      </Link>

      {interview.subject && (
        <Link
          href={`/subjects/${interview.subject.id}`}
          className="mb-2 inline-block rounded-full border-2 border-black px-3 py-0.5 text-xs font-bold hover:bg-black hover:text-white"
        >
          {interview.subject.name}
        </Link>
      )}
      <h1 className="font-display text-3xl">{interview.topic}</h1>
      <p className="mb-8 text-sm text-black/60">{interview.goal}</p>

      {!analysis && interview.status === "active" && (
        <div className="mb-8 rounded-2xl border-2 border-dashed border-black/20 p-6 text-center text-sm text-black/50">
          This interview is still active.{" "}
          <Link href={`/interview/${id}`} className="font-bold text-purple hover:underline">
            Open it
          </Link>{" "}
          and end it to generate analysis.
        </div>
      )}

      {analysis && (
        <div className="mb-10 space-y-8">
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-purple">
              Summary
            </h2>
            <p className="rounded-2xl border-2 border-black bg-white p-4 text-sm">
              {analysis.summary}
            </p>
          </section>

          {analysis.themes?.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-purple">
                Themes
              </h2>
              <ul className="space-y-3">
                {analysis.themes.map((theme, i) => (
                  <li key={i} className="rounded-2xl border-2 border-black bg-white p-4">
                    <p className="font-bold">{theme.title}</p>
                    <p className="text-sm text-black/60">{theme.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {analysis.quotes?.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-purple">
                Notable quotes
              </h2>
              <ul className="space-y-3">
                {analysis.quotes.map((q, i) => (
                  <li key={i} className="rounded-2xl border-l-8 border-purple bg-white p-4">
                    <p className="italic">&ldquo;{q.quote}&rdquo;</p>
                    <p className="mt-1 text-sm text-black/50">{q.context}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <details className="rounded-2xl border-2 border-black bg-white p-4">
        <summary className="cursor-pointer text-sm font-bold">Full transcript</summary>
        <div className="mt-4 space-y-3">
          {interview.messages.map((m) => (
            <p key={m.id} className="text-sm">
              <span className="font-bold">
                {m.role === "assistant" ? "Interviewer: " : "Participant: "}
              </span>
              {m.content}
            </p>
          ))}
        </div>
      </details>
    </main>
  );
}
