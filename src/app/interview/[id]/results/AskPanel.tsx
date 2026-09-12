"use client";

import { useState } from "react";

type QA = { question: string; answer: string };

export default function AskPanel({ interviewId }: { interviewId: string }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setQuestion("");
    setAsking(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${interviewId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error("failed");
      const { answer } = await res.json();
      setHistory((prev) => [...prev, { question: q, answer }]);
    } catch {
      setError("Couldn't reach Backboard. Try again.");
    } finally {
      setAsking(false);
    }
  }

  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-purple">
        Ask about this interview
      </h2>
      <p className="mb-3 text-xs text-black/50">
        Powered by Backboard — has persistent memory of this conversation across questions.
      </p>

      {history.length > 0 && (
        <div className="mb-3 space-y-3" role="log" aria-live="polite" aria-label="Questions and answers">
          {history.map((qa, i) => (
            <div key={i} className="rounded-2xl border-2 border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
              <p className="text-sm font-bold">{qa.question}</p>
              <p className="mt-1 text-sm text-black/70">{qa.answer}</p>
            </div>
          ))}
        </div>
      )}

      {asking && (
        <p className="mb-3 text-sm text-black/40" aria-live="polite">
          Thinking...
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="ask" className="sr-only">
          Ask a question about this interview
        </label>
        <input
          id="ask"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What frustrated them most?"
          disabled={asking}
          className="flex-1 rounded-full border-2 border-black bg-white px-4 py-2 text-sm outline-none focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={asking || !question.trim()}
          className="btn-pop bg-purple px-5 py-2 text-sm text-white hover:bg-purple-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple disabled:opacity-50"
        >
          Ask
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
