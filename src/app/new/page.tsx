"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Subject = { id: string; name: string };

const NEW_SUBJECT = "__new__";

export default function NewInterviewPage() {
  return (
    <Suspense fallback={null}>
      <NewInterviewForm />
    </Suspense>
  );
}

function NewInterviewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetSubjectId = searchParams.get("subjectId");
  const presetSubjectName = searchParams.get("subjectName");

  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectChoice, setSubjectChoice] = useState<string>(presetSubjectId ?? "");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => res.json())
      .then(setSubjects)
      .catch(() => setSubjects([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body: Record<string, string> = { topic, goal };
    if (subjectChoice === NEW_SUBJECT) {
      if (newSubjectName.trim()) body.subjectName = newSubjectName.trim();
    } else if (subjectChoice) {
      body.subjectId = subjectChoice;
    }

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create interview");

      const interview = await res.json();
      router.push(`/interview/${interview.id}`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  const inputClasses =
    "w-full rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm outline-none focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple";

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="mb-8 font-display text-3xl">New interview</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label htmlFor="topic" className="mb-1.5 block text-sm font-bold">
            Topic
          </label>
          <input
            id="topic"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Onboarding experience for our mobile app"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="goal" className="mb-1.5 block text-sm font-bold">
            Research goal
          </label>
          <textarea
            id="goal"
            required
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={4}
            placeholder="What do you want to learn from this interview?"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="subject" className="mb-1.5 block text-sm font-bold">
            Subject <span className="font-normal text-black/50">(optional)</span>
          </label>
          <select
            id="subject"
            value={subjectChoice}
            onChange={(e) => setSubjectChoice(e.target.value)}
            className={inputClasses}
          >
            <option value="">No subject</option>
            {presetSubjectId && presetSubjectName && (
              <option value={presetSubjectId}>{presetSubjectName}</option>
            )}
            {subjects
              .filter((s) => s.id !== presetSubjectId)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            <option value={NEW_SUBJECT}>+ New subject...</option>
          </select>

          {subjectChoice === NEW_SUBJECT && (
            <div className="mt-3">
              <label htmlFor="newSubjectName" className="mb-1.5 block text-sm font-bold">
                New subject name
              </label>
              <input
                id="newSubjectName"
                required
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="e.g. Jordan Alvarez"
                className={inputClasses}
              />
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-full bg-purple px-6 py-3 text-sm font-bold text-white hover:bg-purple-dark disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create interview"}
        </button>
      </form>
    </main>
  );
}
