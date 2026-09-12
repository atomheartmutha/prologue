import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  if (!subject) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Link href="/" className="mb-6 inline-block text-sm font-bold text-purple hover:underline">
        &larr; Back to all interviews
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{subject.name}</h1>
          {subject.email && <p className="text-sm text-black/60">{subject.email}</p>}
          {subject.notes && <p className="mt-1 text-sm text-black/50">{subject.notes}</p>}
        </div>
        <Link
          href={`/new?subjectId=${subject.id}&subjectName=${encodeURIComponent(subject.name)}`}
          className="rounded-full bg-purple px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-dark"
        >
          New interview
        </Link>
      </div>

      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-purple">
        Interviews ({subject.interviews.length})
      </h2>

      {subject.interviews.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black/20 p-8 text-center text-sm text-black/50">
          No interviews with {subject.name} yet.
        </div>
      ) : (
        <ul className="divide-y divide-black/10 rounded-2xl border-2 border-black bg-white">
          {subject.interviews.map((interview) => (
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
