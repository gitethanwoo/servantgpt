import { NextResponse } from 'next/server';
import { chromium } from "playwright-core";

interface TranscriptSegment {
  time: string;
  text: string;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const browser = await chromium.connectOverCDP(
      `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}`
    );

    try {
      // Getting the default context
      const defaultContext = browser.contexts()[0];
      const page = defaultContext.pages()[0];

      // Navigate to the provided URL
      await page.goto(url);

      // Wait for the page to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to find and click the "More" button if it exists
      try {
        await page.click("tp-yt-paper-button#expand");
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        // Button might not exist, continue anyway
      }

      // Click the "Show transcript" button
      try {
        await page.click('button[aria-label="Show transcript"]');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        return NextResponse.json(
          { error: 'No transcript available for this video' },
          { status: 404 }
        );
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
        return NextResponse.json(
          { error: 'No transcript segments found' },
          { status: 404 }
        );
      }

      // Format transcript into a readable string
      const formattedTranscript = transcriptSegments
        .map(segment => `[${segment.time}] ${segment.text}`)
        .join('\n');

      return NextResponse.json({ transcript: formattedTranscript });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}
