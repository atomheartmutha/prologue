import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/elevenlabs";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const audio = await synthesizeSpeech(text);
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "speech synthesis failed" }, { status: 502 });
  }
}
