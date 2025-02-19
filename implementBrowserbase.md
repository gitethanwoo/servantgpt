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

// Helper function to create a Browserbase session
async function createBrowserbaseSession() {
  try {
    if (!process.env.BROWSERBASE_PROJECT_ID) {
      throw new Error('BROWSERBASE_PROJECT_ID is not set in environment variables');
    }

    const requestBody = {
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      proxies: true,
    };

    console.log('Creating Browserbase session with:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`https://api.browserbase.com/v1/sessions`, {
      method: "POST",
      headers: {
        "x-bb-api-key": `${process.env.BROWSERBASE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Browserbase session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        requestBody
      });
      throw new Error(`Failed to create Browserbase session: ${errorText}`);
    }
  
    const json = await response.json();
    return json;
  } catch (error) {
    console.error('Error in createBrowserbaseSession:', error);
    throw error;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Extract video ID from URL
  const videoId = new URL(url).searchParams.get('v') || 
    url.split('youtu.be/')[1]?.split('?')[0] || '';
  
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
  }

  // Construct thumbnail URL from video ID
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // Create a stream to send progress updates
  const stream = new ReadableStream({
    async start(controller) {
      try {
        sendSSEMessage(controller, { status: 'Firing up the teleporter...' });
        const { id: sessionId } = await createBrowserbaseSession();
        
        sendSSEMessage(controller, { status: 'Putting on my invisibility cloak...' });
        await delay(1500);

        const browser = await chromium.connectOverCDP(
          `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${sessionId}`
        );

        try {
          sendSSEMessage(controller, { status: 'Sneaking into YouTube HQ...' });
          await delay(1000);

          const defaultContext = browser.contexts()[0];
          const page = defaultContext.pages()[0];
          
          // Set longer timeout for navigation with proxy
          await page.goto(url, { timeout: 60000 });
          sendSSEMessage(controller, { status: 'Found the video! Now where did they hide those transcripts...' });
          
          // Wait for the page to fully load
          await new Promise((resolve) => setTimeout(resolve, 2000));
          
          // Wait for and extract video title
          await page.waitForSelector('h1.style-scope.ytd-watch-metadata', { timeout: 10000 });
          const title = await page.$eval(
            'h1.style-scope.ytd-watch-metadata yt-formatted-string', 
            el => el.textContent?.trim() || ''
          );
          
          // For thumbnail, we can use the og:image meta tag which is more reliable
          const thumbnailUrl = await page.$eval(
            'meta[property="og:image"]', 
            el => el.getAttribute('content') || ''
          );

          // Try to find and click the "More" button if it exists
          try {
            await page.waitForSelector("tp-yt-paper-button#expand", { timeout: 5000 });
            await page.click("tp-yt-paper-button#expand");
            sendSSEMessage(controller, { status: 'Opening that heavy filing cabinet...' });
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (e) {
            // Button might not exist, continue anyway
            console.log('Expand button not found, continuing...');
          }

          // Click the "Show transcript" button
          try {
            await page.waitForSelector('button[aria-label="Show transcript"]', { timeout: 5000 });
            await page.click('button[aria-label="Show transcript"]');
            sendSSEMessage(controller, { status: 'Rifling through the papers... 📄' });
            // Wait for transcript panel to load
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } catch (e) {
            sendSSEMessage(controller, { error: 'Rats! No transcript found in this filing cabinet 😕' });
            controller.close();
            return;
          }

          // Wait for and scrape the transcript segments
          try {
            await page.waitForSelector("ytd-transcript-segment-renderer", { timeout: 5000 });
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
              sendSSEMessage(controller, { error: 'Found the folder but it\'s empty! 😮' });
              controller.close();
              return;
            }

            sendSSEMessage(controller, { status: 'Aha! Found it! Just copying these pages...' });
            await delay(1000);

            // Format transcript into a readable string
            const formattedTranscript = transcriptSegments
              .map(segment => `[${segment.time}] ${segment.text}`)
              .join('\n');

            sendSSEMessage(controller, { 
              transcript: formattedTranscript,
              title,
              thumbnailUrl
            });
            controller.close();
          } catch (error) {
            console.error('Error scraping transcript:', error);
            sendSSEMessage(controller, { 
              error: 'Oh no! My invisibility cloak malfunctioned! 🎭 Please try again in a moment...' 
            });
            controller.close();
          }
        } finally {
          await browser.close();
        }
      } catch (error) {
        console.error('Error fetching transcript:', error);
        sendSSEMessage(controller, { 
          error: 'Oh no! My invisibility cloak malfunctioned! 🎭 Please try again in a moment...' 
        });
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
