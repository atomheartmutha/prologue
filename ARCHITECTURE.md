# Prologue — Architecture

Prologue is an AI-led UX research tool: a researcher creates an interview (topic + goal), a participant has a live voice-or-text conversation with an AI interviewer, and ending the interview auto-generates a summary, themes, and quotes. A separate AI layer with persistent memory lets the researcher ask follow-up questions about any past interview.

Live: [prologue-sooty.vercel.app](https://prologue-sooty.vercel.app)
Repo: [github.com/atomheartmutha/prologue](https://github.com/atomheartmutha/prologue)

## Stack at a glance

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server components for data-heavy pages, API routes for everything stateful, one deployable unit |
| Styling | Tailwind CSS v4 | CSS-first `@theme` tokens for the brand palette/fonts; no separate design-system build step |
| Database | Postgres via [Neon](https://neon.tech) | Serverless Postgres with instant branching — `main` (production) and `dev` are separate branches so local testing never touches real data |
| ORM | Prisma (`prisma db push`, no migration files) | Schema-as-source-of-truth; `db push` syncs schema on every build, appropriate for a fast-moving MVP |
| Interview AI | [Anthropic Claude](https://www.anthropic.com) (`claude-sonnet-5`) via `@anthropic-ai/sdk` | Conducts the live interview (one adaptive question at a time) and generates the structured post-interview analysis (summary/themes/quotes) |
| Voice input | Web Speech API (`SpeechRecognition`) | Browser-native speech-to-text, feature-detected, never required — always falls back to typing |
| Voice output | [ElevenLabs](https://elevenlabs.io) text-to-speech (voice: **Burt**) | Reads the AI interviewer's questions aloud, toggleable, with a manual "Play" fallback when the browser blocks autoplay |
| Memory / Q&A | [Backboard](https://backboard.io) | Powers "Ask about this interview" on the results page — a separate conversational layer with its own persistent thread memory per interview, distinct from the live-interview Claude conversation |
| Analytics | Vercel Analytics | Pageview tracking on the deployed app |
| Hosting | Vercel | Git-connected deploys from `main`; Neon integration injects `DATABASE_URL` automatically |

## Data model

```
Subject (a research participant, optional)
 └─ Interview (topic, goal, status, analysis JSON, backboardThreadId)
     └─ Message (role: assistant | subject, content)
```

A `Subject` is the "folder" for a person — every interview with them shows up under their subject page. An `Interview` can also exist with no subject.

## Request flow: conducting an interview

1. Researcher creates an `Interview` (`POST /api/interviews`), optionally attached to a `Subject`.
2. The participant opens `/interview/[id]`. On first load with zero messages, the client requests a kickoff (`POST /api/interviews/[id]/messages` with no content) — Claude opens with an introduction and first question, guarded against a double-fire race with a client-side ref.
3. Each participant reply (typed, or transcribed from speech) is appended and Claude is called again with the full running transcript, returning one adaptive follow-up question.
4. If voice replies are enabled, every new assistant message is sent to `POST /api/tts`, which calls ElevenLabs with the Burt voice and streams back MP3 audio for playback.
5. Ending the interview (`POST /api/interviews/[id]/complete`) sends the full transcript to Claude with a JSON-only system prompt, producing `{ summary, themes[], quotes[] }`, stored on the `Interview` row.

## Request flow: asking about a finished interview

`AskPanel` on the results page calls `POST /api/interviews/[id]/ask`. On the first question, the route builds a context-priming prompt (topic, goal, full transcript, analysis summary) and sends it to Backboard with no `threadId` — Backboard auto-creates a thread and returns one. That `threadId` is saved on the `Interview` row, so every subsequent question only needs to send the new question; Backboard's own memory keeps the earlier context in play.

## Data export

`GET /api/export` streams every subject, interview, transcript, and analysis in the project as a single plain-text file (`prologue-export.txt`), formatted for an AI (or a human) to read end to end in one pass — linked from the dashboard footer.

## Accessibility

- Every input has an associated `<label>` (visually hidden where the field's purpose is already clear from context).
- The interview transcript is a `role="log"` / `aria-live="polite"` region, so new messages are announced to screen readers as they arrive.
- Voice input and voice replies are both feature-detected enhancements — the app is fully usable by typing/reading alone.
- Default focus outlines were replaced with explicit `focus-visible` rings (never removed outright).
- Decorative sparkle animations respect `prefers-reduced-motion`.
- The purple/cream/black palette was checked for contrast and comfortably clears WCAG AAA for normal text.

## Environment variables

| Variable | Used by |
|---|---|
| `DATABASE_URL` | Prisma / Neon |
| `ANTHROPIC_API_KEY` | Claude (interview + analysis) |
| `ELEVENLABS_API_KEY` | Burt voice TTS |
| `BACKBOARD_API_KEY` | "Ask about this interview" |

Local development points at a separate Neon branch (`dev`) via `npx neon@latest checkout dev`; production reads from `main` through Vercel's Neon integration. See [README.md](README.md) for setup.
