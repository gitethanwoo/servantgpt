import { openai } from "@ai-sdk/openai";
import {streamObject} from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 60;

const sentimentSchema = z.object({
    timestampStart: z.string()
        .regex(/^\[\d{2}:\d{2}:\d{2}\]$/, "Must be in format [HH:MM:SS]")
        .describe("The timestamp where this sentiment shift begins. Use the exact timestamp from the transcript (e.g., [00:12:04])."),
    relevantText: z.string().describe("The key quote or segment that shows the sentiment change. Include enough context to understand the shift. This should start with the text at the specified timestampStart."),
    sentimentCommentary: z.string().describe("Explain how and why the sentiment shifted at this point, considering the broader context of the conversation."),
    sentimentDescriptor: z.string().describe("A single word that captures the emotional tone at this moment (e.g., 'worried', 'optimistic', 'concerned', 'confident')"),
    sentiment: z.enum(["very positive", "positive", "neutral", "negative", "very negative"]).describe("The overall sentiment category that best matches this moment"),
})

const sentimentAnalysisPrompt = `Analyze the emotional flow and sentiment changes in this conversation transcript. Your task is to identify key moments where the emotional tone or sentiment notably shifts.

Important Guidelines:
- Track the continuous flow of sentiment throughout the conversation
- Look for natural transition points where the topic or emotional tone shifts
- Use the exact timestamps from the transcript (e.g., [00:12:04])
- Consider the broader context and how sentiments evolve over time
- Focus on substantive changes in tone or perspective, not just minor variations
- Pay attention to:
  * Topic transitions
  * Shifts in emotional intensity
  * Changes in speaker perspective
  * New concerns or hopes being introduced
  * Responses to previous points that change the tone

Remember: Focus on capturing the natural flow of the conversation's emotional journey, not just isolated moments. It is helpful to consider the sentiment at the beginning of the conversation as well. 

Here is the transcript:

`

export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        
        if (!text) {
            return new Response('Missing text in request body', { status: 400 });
        }

        const result = streamObject({
            model: openai("gpt-4o"),
            schema: sentimentSchema,
            output: 'array',
            prompt: sentimentAnalysisPrompt + text,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('Error in sentiment analysis:', error);
        return new Response('Error processing request', { status: 500 });
    }
}