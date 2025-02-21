import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: "No prompt provided" },
        { status: 400 }
      );
    }

    const response = streamText({
      model: openai("gpt-4o-mini"),
      system: "You are a helpful AI assistant that processes data in table cells. Keep your responses concise and focused on the task.",
      prompt,
      maxTokens: 400,
    });

    return response.toDataStreamResponse();

  } catch (error) {
    console.error("Error processing AI request:", error);
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}
