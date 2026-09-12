"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewInterviewPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, goal }),
      });

      if (!res.ok) throw new Error("Failed to create interview");

      const interview = await res.json();
      router.push(`/interview/${interview.id}`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="mb-8 font-display text-3xl">New interview</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label className="mb-1.5 block text-sm font-bold">Topic</label>
          <input
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Onboarding experience for our mobile app"
            className="w-full rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm outline-none focus:border-purple"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold">Research goal</label>
          <textarea
            required
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={4}
            placeholder="What do you want to learn from this interview?"
            className="w-full rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm outline-none focus:border-purple"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

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
