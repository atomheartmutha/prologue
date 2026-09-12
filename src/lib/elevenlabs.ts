const BURT_VOICE_ID = "4YYIPFl9wE5c4L2eu2Gb";

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${BURT_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${detail}`);
  }

  return response.arrayBuffer();
}
