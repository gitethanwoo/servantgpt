import { streamText, createDataStreamResponse, smoothStream } from 'ai';
import { openai } from '@ai-sdk/openai';
import { auth } from '@/app/(auth)/auth';
import { generateUUID } from '@/lib/utils';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { messages, resourceId, transcript, title } = body;

    console.log("Received request:", { 
      messageCount: messages?.length, 
      resourceId, 
      titleLength: title?.length,
      transcriptLength: transcript?.length 
    });

    if (!transcript) {
      return new Response('Missing transcript', { status: 400 });
    }

    // Ensure we have messages to process
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const systemPrompt = `You are an AI assistant helping users understand a resource titled "${title}".
You have access to the transcript of this resource, which is provided below.
Use this transcript to answer the user's questions accurately and helpfully.
If the answer is not in the transcript, you can provide general knowledge but make it clear that this information is not from the resource.
If you're unsure or the question is completely unrelated to the resource, politely guide the user back to the resource topic.

TRANSCRIPT:
${transcript}`;

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: openai('gpt-4o'),
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            ...messages
          ],
          temperature: 0.7,
          maxTokens: 1000,
          experimental_generateMessageId: generateUUID,
          experimental_transform: smoothStream({ chunking: 'word' }),
        });

        result.mergeIntoDataStream(dataStream);
      },
      onError: (error: unknown) => {
        console.error('Error in resource chat:', error);
        
        if (error == null) {
          return 'unknown error';
        }

        if (typeof error === 'string') {
          return error;
        }

        if (error instanceof Error) {
          return error.message;
        }

        return JSON.stringify(error);
      }
    });
  } catch (error: any) {
    console.error('Error in resource chat:', error);
    return new Response(`Error processing request: ${error?.message || 'Unknown error'}`, { status: 500 });
  }
} 