import { NextResponse } from 'next/server';
import { chromium } from "playwright-core";

interface TranscriptSegment {
  time: string;
  text: string;
}

// Helper function to simulate realistic delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to send SSE message
function sendSSEMessage(controller: ReadableStreamDefaultController, data: any) {
  controller.enqueue(
    new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Create a stream to send progress updates
  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendSSEMessage(controller, { status: 'Connecting to browser...' });
        await delay(1500); // Simulate connection time

        const browser = await chromium.connectOverCDP(
          `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}`
        );

        try {
          sendSSEMessage(controller, { status: 'Browser connected, loading video page...' });
          await delay(1000);

          const defaultContext = browser.contexts()[0];
          const page = defaultContext.pages()[0];

          await page.goto(url);
          sendSSEMessage(controller, { status: 'Page loaded, searching for transcript...' });
          await delay(2000);

          // Try to find and click the "More" button if it exists
          try {
            await page.click("tp-yt-paper-button#expand");
            await delay(500);
          } catch (e) {
            // Button might not exist, continue anyway
          }

          // Click the "Show transcript" button
          try {
            await page.click('button[aria-label="Show transcript"]');
            sendSSEMessage(controller, { status: 'Found transcript button, loading transcript...' });
            await delay(1500);
          } catch (e) {
            sendSSEMessage(controller, { error: 'No transcript available for this video' });
            controller.close();
            return;
          }

          // Scrape the transcript segments
          const transcriptSegments = await page.$$eval<TranscriptSegment[]>(
            "ytd-transcript-segment-renderer",
            (segments) => {
              return segments.map((segment) => {
                const timeElement = segment.querySelector(".segment-timestamp");
                const textElement = segment.querySelector(".segment-text");
                return {
                  time: timeElement?.textContent?.trim() || "0:00",
                  text: textElement?.textContent?.trim() || "",
                };
              });
            }
          );

          if (!transcriptSegments.length) {
            sendSSEMessage(controller, { error: 'No transcript segments found' });
            controller.close();
            return;
          }

          sendSSEMessage(controller, { status: 'Formatting transcript...' });
          await delay(1000);

          // Format transcript into a readable string
          const formattedTranscript = transcriptSegments
            .map(segment => `[${segment.time}] ${segment.text}`)
            .join('\n');

          sendSSEMessage(controller, { transcript: formattedTranscript });
          controller.close();
        } finally {
          await browser.close();
        }
      } catch (error) {
        console.error('Error fetching transcript:', error);
        sendSSEMessage(controller, { error: 'Failed to fetch transcript' });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
