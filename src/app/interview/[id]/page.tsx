"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Message = {
  id: string;
  role: "assistant" | "subject";
  content: string;
};

type Interview = {
  id: string;
  topic: string;
  goal: string;
  status: "active" | "completed";
  messages: Message[];
};

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/interviews/${id}`);
      const data: Interview = await res.json();
      setInterview(data);

      if (data.status === "active" && data.messages.length === 0) {
        setSending(true);
        const replyRes = await fetch(`/api/interviews/${id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const reply: Message = await replyRes.json();
        setInterview((prev) => (prev ? { ...prev, messages: [reply] } : prev));
        setSending(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interview?.messages.length, sending]);

  async function sendMessage() {
    if (!draft.trim() || !interview) return;
    const content = draft.trim();
    setDraft("");
    setSending(true);

    setInterview((prev) =>
      prev
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              { id: `temp-${Date.now()}`, role: "subject", content },
            ],
          }
        : prev
    );

    const res = await fetch(`/api/interviews/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const reply: Message = await res.json();

    setInterview((prev) =>
      prev ? { ...prev, messages: [...prev.messages, reply] } : prev
    );
    setSending(false);
  }

  async function endInterview() {
    setEnding(true);
    await fetch(`/api/interviews/${id}/complete`, { method: "POST" });
    router.push(`/interview/${id}/results`);
  }

  if (!interview) {
    return <main className="flex-1 px-6 py-12 text-center text-black/50">Loading...</main>;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
      <div className="mb-4 flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="font-display text-2xl">{interview.topic}</h1>
          <p className="text-sm text-black/60">You&apos;re chatting with an AI interviewer.</p>
        </div>
        <button
          onClick={endInterview}
          disabled={ending || interview.status === "completed"}
          className="rounded-full border-2 border-black px-4 py-1.5 text-sm font-bold hover:bg-black hover:text-white disabled:opacity-50"
        >
          {ending ? "Ending..." : "End interview"}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {interview.messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "subject" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "subject"
                  ? "bg-purple text-white"
                  : "bg-white border-2 border-black"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl border-2 border-black/20 bg-white px-4 py-2 text-sm text-black/40">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {interview.status === "active" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2 border-t-2 border-black pt-4"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your reply..."
            disabled={sending}
            className="flex-1 rounded-full border-2 border-black bg-white px-4 py-2 text-sm outline-none focus:border-purple disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-full bg-purple px-6 py-2 text-sm font-bold text-white hover:bg-purple-dark disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : (
        <p className="border-t-2 border-black pt-4 text-center text-sm text-black/50">
          This interview has ended.
        </p>
      )}
    </main>
  );
}
