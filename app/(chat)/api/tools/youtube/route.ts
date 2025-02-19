import { NextResponse } from 'next/server';
import { fetchTranscript } from 'youtube-transcript-plus';
import { chromium } from 'playwright-core';

export const config = {
  runtime: 'nodejs',
};

async function createBrowserbaseSession() {
  const response = await fetch(`https://api.browserbase.com/v1/sessions`, {
    method: "POST",
    headers: {
      "x-bb-api-key": `${process.env.BROWSERBASE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      proxies: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create Browserbase session');
  }

  return response.json();
}

// Helper function to decode HTML entities
function decodeHTMLEntities(text: string) {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };
  return text.replace(/&amp;#39;|&amp;|&lt;|&gt;|&quot;|&#39;|&apos;/g, match => entities[match] || match);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url).searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const videoId = new URL(url).searchParams.get('v') || 
      url.split('youtu.be/')[1]?.split('?')[0] || '';
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Get video title from oEmbed
    const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    const { title: videoTitle } = await oembedResponse.json();

    // Create Browserbase session
    const { id: sessionId } = await createBrowserbaseSession();
    
    // Connect to browser
    const browser = await chromium.connectOverCDP(
      `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${sessionId}`
    );

    try {
      const defaultContext = browser.contexts()[0];
      const page = defaultContext.pages()[0];

      // Get transcript
      const transcript = await fetchTranscript(videoId, {
        transcriptFetch: async ({ url, lang, userAgent }) => {
          const response = await page.evaluate(async ({ url, headers }) => {
            const res = await fetch(url, { headers });
            const text = await res.text();
            return { 
              text,
              status: res.status,
              headers: Object.fromEntries(res.headers.entries())
            };
          }, { 
            url,
            headers: {
              ...(lang && { 'Accept-Language': lang }),
              'User-Agent': userAgent || 'Mozilla/5.0',
            }
          });

          return new Response(response.text, {
            status: response.status,
            headers: new Headers(response.headers),
          });
        },
      });

      const formattedTranscript = transcript
        .map(segment => `[${new Date(segment.offset * 1000).toISOString().substr(11, 8)}] ${decodeHTMLEntities(segment.text)}`)
        .join('\n');

      return NextResponse.json({
        transcript: formattedTranscript,
        title: videoTitle || `YouTube Video ${videoId}`,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });

    } finally {
      await browser.close();
    }

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch transcript' }, { status: 500 });
  }
}