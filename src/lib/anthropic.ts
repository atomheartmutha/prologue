import Anthropic from "@anthropic-ai/sdk";
import { MAX_QUESTIONS } from "./interviewConfig";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = "claude-sonnet-5";

function extractText(response: Anthropic.Message): string {
  const block = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  return block?.text ?? "";
}

export type TranscriptMessage = {
  role: "assistant" | "subject";
  content: string;
};

function interviewerSystemPrompt(
  topic: string,
  goal: string,
  questionNumber: number
) {
  const isClosing = questionNumber >= MAX_QUESTIONS;

  return `You are Prologue, a skilled UX researcher conducting a live, conversational interview with a research participant.

Interview topic: ${topic}
Research goal: ${goal}

This is question ${questionNumber} of a maximum of ${MAX_QUESTIONS} for this interview.

Rules:
- Ask ONE question at a time. Never bundle multiple questions into one message.
- Keep questions open-ended and conversational, not leading.
- Actively follow up on specifics the participant mentions ("you said X, can you tell me more about that?") rather than working through a rigid script.
- Keep your messages short (1-4 sentences).
- Do not summarize, analyze, or break character. You are only conducting the interview.
- If this is the very first message (no prior conversation), briefly introduce yourself in one sentence, explain what the interview is about in one sentence, and then ask your first question.
${
  isClosing
    ? `- This is the FINAL turn of the interview, and the participant will not be able to reply after this message. Do NOT ask a question of any kind. Instead, warmly thank the participant for their time and insights, briefly note one thing you appreciated hearing, and clearly state that the interview is now complete.`
    : ""
}`;
}

export async function generateInterviewerReply(
  topic: string,
  goal: string,
  transcript: TranscriptMessage[]
): Promise<string> {
  const questionNumber = transcript.filter((m) => m.role === "assistant").length + 1;

  const messages: Anthropic.MessageParam[] =
    transcript.length === 0
      ? [{ role: "user", content: "[Begin the interview now.]" }]
      : transcript.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        }));

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 500,
    system: interviewerSystemPrompt(topic, goal, questionNumber),
    messages,
  });

  const text = extractText(response);
  return text || "Sorry, could you say that again?";
}

export type Analysis = {
  summary: string;
  themes: { title: string; description: string }[];
  quotes: { quote: string; context: string }[];
};

export async function generateAnalysis(
  topic: string,
  goal: string,
  transcript: TranscriptMessage[]
): Promise<Analysis> {
  const transcriptText = transcript
    .map((m) => `${m.role === "assistant" ? "Interviewer" : "Participant"}: ${m.content}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: `You are a UX research analyst. You will be given the topic, goal, and full transcript of a user interview. Produce a structured analysis.

Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "summary": "2-4 sentence overview of what was learned",
  "themes": [{ "title": "short theme name", "description": "1-2 sentence description grounded in what the participant said" }],
  "quotes": [{ "quote": "exact or lightly cleaned-up quote from the participant", "context": "1 sentence on why this quote matters" }]
}

Include 3-6 themes and 3-6 quotes. Only use content the participant actually said.`,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}\nGoal: ${goal}\n\nTranscript:\n${transcriptText}`,
      },
    ],
  });

  const text = extractText(response) || "{}";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : text;

  try {
    return JSON.parse(jsonText) as Analysis;
  } catch {
    return { summary: text, themes: [], quotes: [] };
  }
}
