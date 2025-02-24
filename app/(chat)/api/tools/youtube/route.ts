import { NextResponse } from 'next/server';
import { chromium } from 'playwright-core';

// Add type declaration for YouTube's window object
declare global {
  interface Window {
    ytInitialPlayerResponse?: {
      captions?: {
        playerCaptionsTracklistRenderer?: {
          captionTracks?: Array<{
            baseUrl: string;
            name: { simpleText: string };
            languageCode: string;
          }>;
        };
      };
    };
  }
}

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

      // Block unnecessary resources
      await page.route('**/*', async (route) => {
        const request = route.request();
        const resourceType = request.resourceType();
        
        // Only allow document and script resources, block everything else
        if (resourceType === 'document' || resourceType === 'script') {
          // For scripts, only allow those that might contain the player response
          if (resourceType === 'script' && !request.url().includes('base.js')) {
            return route.abort();
          }
          return route.continue();
        }
        
        // Block all other resource types
        return route.abort();
      });

      // Set a shorter timeout since we're only interested in the initial data
      page.setDefaultTimeout(20000);

      // Load the page with minimal features
      await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
        waitUntil: 'domcontentloaded', // Don't wait for full page load
      });
      
      // Extract captions data as soon as it's available
      const captionsData = await page.evaluate(() => {
        const maxAttempts = 10;
        let attempts = 0;
        
        return new Promise<{ baseUrl: string } | null>((resolve) => {
          const checkData = () => {
            attempts++;
            const ytInitialPlayerResponse = window.ytInitialPlayerResponse;
            if (ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
              resolve(ytInitialPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks[0]);
            } else if (attempts < maxAttempts) {
              setTimeout(checkData, 100);
            } else {
              resolve(null);
            }
          };
          checkData();
        });
      });

      if (!captionsData) {
        return NextResponse.json({ error: 'No captions available' }, { status: 404 });
      }

      // Fetch the caption track XML
      const response = await page.request.fetch(captionsData.baseUrl);
      const xmlText = await response.text();
      
      // Parse the XML to extract timed text
      const transcript: { offset: number; text: string }[] = [];
      const regex = /<text start="([^"]*)"[^>]*>([^<]*)<\/text>/g;
      let match;
      
      while ((match = regex.exec(xmlText)) !== null) {
        transcript.push({
          offset: parseFloat(match[1]),
          text: decodeHTMLEntities(match[2].trim())
        });
      }

      const formattedTranscript = transcript
        .map(segment => `[${new Date(segment.offset * 1000).toISOString().substr(11, 8)}] ${segment.text}`)
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