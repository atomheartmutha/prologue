"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewSubjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, notes }),
      });

      if (!res.ok) throw new Error("Failed to create subject");

      const subject = await res.json();
      router.push(`/subjects/${subject.id}`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="mb-8 font-display text-3xl">New subject</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-bold">
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jordan Alvarez"
            className="w-full rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm outline-none focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-bold">
            Email <span className="font-normal text-black/50">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jordan@example.com"
            className="w-full rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm outline-none focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple"
          />
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-bold">
            Notes <span className="font-normal text-black/50">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything worth remembering about this person"
            className="w-full rounded-xl border-2 border-black bg-white px-4 py-2.5 text-sm outline-none focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple"
          />
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
          {loading ? "Creating..." : "Create subject"}
        </button>
      </form>
    </main>
  );
}
