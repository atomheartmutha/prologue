import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Sparkle from "@/components/Sparkle";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const [subjects, interviews] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { interviews: true } } },
    }),
    prisma.interview.findMany({
      where: query
        ? {
            OR: [
              { topic: { contains: query, mode: "insensitive" } },
              { goal: { contains: query, mode: "insensitive" } },
              { subject: { name: { contains: query, mode: "insensitive" } } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { subject: true, _count: { select: { messages: true } } },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div className="relative">
          <Sparkle className="sparkle-wiggle absolute -right-6 -top-2 h-5 w-5 text-green" />
          <h1 className="font-display text-4xl">Prologue</h1>
          <p className="text-sm text-black/60">AI-led UX interviews, analyzed automatically.</p>
        </div>
        <Link
          href="/new"
          className="btn-pop bg-purple px-6 py-3 text-sm text-white hover:bg-purple-dark"
        >
          New interview
        </Link>
      </div>

      <form action="/" method="get" role="search" className="mb-10">
        <label htmlFor="search" className="mb-1.5 block text-sm font-bold">
          Search interviews
        </label>
        <input
          id="search"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by topic, goal, or subject name"
          className="w-full rounded-full border-2 border-black bg-white px-5 py-2.5 text-sm outline-none focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple"
        />
      </form>

      <section className="mb-10">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-purple">
            Subjects ({subjects.length})
          </h2>
          <Link href="/subjects/new" className="text-sm font-bold text-purple hover:underline">
            + New subject
          </Link>
        </div>

        {subjects.length === 0 ? (
          <p className="text-sm text-black/50">
            No subjects yet. Interviews can be grouped under a subject when you create them.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {subjects.map((subject) => (
              <li key={subject.id}>
                <Link
                  href={`/subjects/${subject.id}`}
                  className="card-pop block p-4 hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple"
                >
                  <p className="font-bold">{subject.name}</p>
                  <p className="text-xs text-black/50">
                    {subject._count.interviews}{" "}
                    {subject._count.interviews === 1 ? "interview" : "interviews"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-purple">
          {query ? `Results for "${query}"` : "All interviews"}
        </h2>

        {interviews.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-black/20 p-8 text-center text-sm text-black/50">
            {query
              ? "No interviews match that search."
              : "No interviews yet. Create one to get a shareable link for a participant."}
          </div>
        ) : (
          <ul className="divide-y divide-black/10 rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_0_#000]">
            {interviews.map((interview) => (
              <li key={interview.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-bold">{interview.topic}</p>
                  <p className="text-sm text-black/50">
                    {interview.subject ? `${interview.subject.name} · ` : ""}
                    {interview.status === "completed" ? "Completed" : "Active"} ·{" "}
                    {interview._count.messages} messages
                  </p>
                </div>
                <div className="flex gap-4 text-sm font-bold">
                  {interview.status === "active" && (
                    <Link href={`/interview/${interview.id}`} className="text-purple hover:underline">
                      Open
                    </Link>
                  )}
                  <Link href={`/interview/${interview.id}/results`} className="text-purple hover:underline">
                    Results
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="border-t-2 border-black/10 pt-6 text-center text-xs text-black/40">
        <a href="/api/export" className="font-bold text-purple hover:underline">
          ⬇ Download all data (.txt)
        </a>
        <p className="mt-2">
          Built with Claude, ElevenLabs (Burt), Backboard, Neon, and Vercel.
        </p>
      </footer>
    </main>
  );
}
