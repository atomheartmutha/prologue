# Prologue

AI-led UX interviews with automatic analysis. A researcher creates an interview (topic + goal), a participant chats with an AI interviewer that asks adaptive follow-ups, and ending the interview generates a summary, themes, and quotes.

Live at [prologue-sooty.vercel.app](https://prologue-sooty.vercel.app).

## Stack

- Next.js (App Router) + Tailwind CSS v4
- Postgres via [Neon](https://neon.tech), accessed with Prisma (`prisma db push`, not migrations)
- Claude (`@anthropic-ai/sdk`) for both conducting interviews and generating post-interview analysis
- Deployed on Vercel

## Local development

This project's database is a Neon branch, kept separate from production:

```bash
npx neon@latest checkout dev
```

This links the project (first run) and pulls that branch's `DATABASE_URL` into `.env`. Local writes only affect the `dev` branch — production reads/writes the `main` branch.

Then:

```bash
npm install
npm run dev
```

`npm run dev` doesn't run `prisma db push` automatically — if you change `prisma/schema.prisma`, run:

```bash
npx prisma db push
```

You'll also need `ANTHROPIC_API_KEY` set in `.env` (get one from [console.anthropic.com](https://console.anthropic.com)).

## Deploying

Production deploys via `vercel deploy --prod`. The `build` script runs `prisma db push` against whatever `DATABASE_URL` Vercel injects (from the Neon integration, pointed at the `main` branch) before building.
