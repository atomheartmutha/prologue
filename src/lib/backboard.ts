import { BackboardClient, ChatMessagesResponse } from "backboard-sdk";

let client: BackboardClient | null = null;

function getClient(): BackboardClient {
  if (!client) {
    const apiKey = process.env.BACKBOARD_API_KEY;
    if (!apiKey) throw new Error("BACKBOARD_API_KEY is not set");
    client = new BackboardClient({ apiKey });
  }
  return client;
}

export async function askBackboard(
  content: string,
  threadId?: string | null
): Promise<{ content: string; threadId: string }> {
  const response = (await getClient().sendMessage({
    content,
    threadId: threadId ?? undefined,
    stream: false,
  })) as ChatMessagesResponse;

  if (!response.content || !response.threadId) {
    throw new Error("Backboard returned an unexpected response shape");
  }

  return { content: response.content, threadId: response.threadId };
}
