"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";
import Sparkle from "@/components/Sparkle";
import { MAX_QUESTIONS } from "@/lib/interviewConfig";

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
  subject: { id: string; name: string } | null;
  messages: Message[];
};

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(true);
  const [needsTapId, setNeedsTapId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const spokenIdsRef = useRef<Set<string>>(new Set());
  const kickoffStartedRef = useRef(false);

  const handleSpeechResult = useCallback((transcript: string) => {
    setDraft(transcript);
  }, []);

  const {
    supported: voiceSupported,
    listening,
    error: voiceError,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition(handleSpeechResult);

  const speak = useCallback(async (text: string, messageId: string) => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok || !audioRef.current) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
      await audioRef.current.play();
      setNeedsTapId((current) => (current === messageId ? null : current));
    } catch {
      setNeedsTapId(messageId);
    }
  }, []);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/interviews/${id}`);
      const data: Interview = await res.json();
      setInterview(data);

      if (data.status === "active" && data.messages.length === 0 && !kickoffStartedRef.current) {
        kickoffStartedRef.current = true;
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
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interview?.messages.length, sending]);

  useEffect(() => {
    if (!sending && interview?.status === "active") {
      inputRef.current?.focus();
    }
  }, [sending, interview?.status]);

  useEffect(() => {
    if (!interview || !voiceRepliesEnabled) return;
    const last = interview.messages[interview.messages.length - 1];
    if (!last || last.role !== "assistant" || spokenIdsRef.current.has(last.id)) return;
    spokenIdsRef.current.add(last.id);
    speak(last.content, last.id);
  }, [interview, voiceRepliesEnabled, speak]);

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
    audioRef.current?.pause();
    await fetch(`/api/interviews/${id}/complete`, { method: "POST" });
    router.push(`/interview/${id}/results`);
  }

  function toggleVoiceReplies() {
    setVoiceRepliesEnabled((enabled) => {
      if (enabled) audioRef.current?.pause();
      return !enabled;
    });
  }

  if (!interview) {
    return (
      <main className="flex-1 px-6 py-12 text-center text-black/50" aria-live="polite">
        Loading...
      </main>
    );
  }

  const assistantQuestionCount = interview.messages.filter(
    (m) => m.role === "assistant"
  ).length;
  const reachedMax = assistantQuestionCount >= MAX_QUESTIONS;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
      <audio ref={audioRef} className="hidden" />

      <div className="mb-4 flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          {interview.subject && (
            <p className="text-xs font-bold uppercase tracking-wide text-purple">
              {interview.subject.name}
            </p>
          )}
          <div className="relative w-fit">
            <Sparkle className="sparkle-wiggle absolute -right-5 -top-1 h-3.5 w-3.5 text-green" />
            <h1 className="font-display text-2xl">{interview.topic}</h1>
          </div>
          <p className="text-sm text-black/60">You&apos;re chatting with an AI interviewer.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleVoiceReplies}
            aria-pressed={voiceRepliesEnabled}
            aria-label={voiceRepliesEnabled ? "Turn off voice replies" : "Turn on voice replies"}
            title={voiceRepliesEnabled ? "Turn off voice replies" : "Turn on voice replies"}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-black text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple ${
              voiceRepliesEnabled ? "bg-purple text-white" : "bg-white hover:bg-cream"
            }`}
          >
            <span aria-hidden="true">{voiceRepliesEnabled ? "🔊" : "🔇"}</span>
          </button>
          <button
            onClick={endInterview}
            disabled={ending || interview.status === "completed"}
            className="rounded-full border-2 border-black px-4 py-1.5 text-sm font-bold hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple disabled:opacity-50"
          >
            {ending ? "Ending..." : "End interview"}
          </button>
        </div>
      </div>

      <div
        className="flex-1 space-y-4 overflow-y-auto py-4"
        role="log"
        aria-live="polite"
        aria-label="Interview transcript"
      >
        {interview.messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "subject" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-[3px_3px_0_0_#000] ${
                m.role === "subject"
                  ? "bg-purple text-white"
                  : "bg-white border-2 border-black"
              }`}
            >
              <span className="sr-only">
                {m.role === "subject" ? "You said: " : "Interviewer said: "}
              </span>
              {m.content}
              {needsTapId === m.id && (
                <button
                  type="button"
                  onClick={() => speak(m.content, m.id)}
                  className="ml-2 rounded-full border border-black px-2 py-0.5 text-xs font-bold hover:bg-cream"
                >
                  🔊 Play
                </button>
              )}
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

      {interview.status === "active" && reachedMax ? (
        <div className="border-t-2 border-black pt-4 text-center">
          <p className="mb-3 text-sm text-black/60">
            This interview has reached its natural end.
          </p>
          <button
            onClick={endInterview}
            disabled={ending}
            className="btn-pop bg-purple px-6 py-2.5 text-sm text-white hover:bg-purple-dark disabled:opacity-50"
          >
            {ending ? "Finishing..." : "Finish & view results"}
          </button>
        </div>
      ) : interview.status === "active" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="border-t-2 border-black pt-4"
        >
          <div className="flex gap-2">
            <label htmlFor="reply" className="sr-only">
              Your reply
            </label>
            <input
              id="reply"
              ref={inputRef}
              autoFocus
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
              className="flex-1 rounded-full border-2 border-black bg-white px-4 py-2 text-sm outline-none focus-visible:border-purple focus-visible:ring-2 focus-visible:ring-purple disabled:opacity-50"
            />
            {voiceSupported && (
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                disabled={sending}
                aria-pressed={listening}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                title={listening ? "Stop voice input" : "Start voice input"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple disabled:opacity-50 ${
                  listening ? "bg-purple text-white" : "bg-white hover:bg-cream"
                }`}
              >
                <span aria-hidden="true">{listening ? "■" : "🎤"}</span>
              </button>
            )}
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="btn-pop bg-purple px-6 py-2 text-sm text-white hover:bg-purple-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p aria-live="polite" className="mt-2 text-xs text-black/50">
            {listening ? "Listening..." : voiceError ?? ""}
          </p>
        </form>
      ) : (
        <p className="border-t-2 border-black pt-4 text-center text-sm text-black/50">
          This interview has ended.
        </p>
      )}
    </main>
  );
}
