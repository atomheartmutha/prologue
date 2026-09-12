import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const interviews = await prisma.interview.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl">Prologue</h1>
          <p className="text-sm text-black/60">AI-led UX interviews, analyzed automatically.</p>
        </div>
        <Link
          href="/new"
          className="rounded-full bg-purple px-6 py-3 text-sm font-bold text-white hover:bg-purple-dark"
        >
          New interview
        </Link>
      </div>

      {interviews.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black/20 p-8 text-center text-sm text-black/50">
          No interviews yet. Create one to get a shareable link for a participant.
        </div>
      ) : (
        <ul className="divide-y divide-black/10 rounded-2xl border-2 border-black bg-white">
          {interviews.map((interview) => (
            <li key={interview.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="font-bold">{interview.topic}</p>
                <p className="text-sm text-black/50">
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
    </main>
  );
}
