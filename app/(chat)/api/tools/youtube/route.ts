import { NextResponse } from 'next/server';
import { getSubtitles } from '@treeee/youtube-caption-extractor';

interface Subtitle {
  start: string;
  dur: string;
  text: string;
}

// Create a more browser-like fetch
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'DNT': '1',
    'Connection': 'keep-alive',
    ...init?.headers // Merge any passed headers
  };

  // First try with our custom headers
  try {
    const response = await fetch(input, { ...init, headers });
    return response;
  } catch (error) {
    console.error('Error with custom headers fetch:', error);
    // Fallback to default fetch if custom headers fail
    return fetch(input, init);
  }
};

// Monkey patch the global fetch for the youtube-caption-extractor package
const originalFetch = global.fetch;
global.fetch = customFetch as typeof global.fetch;

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    // Extract video ID from URL
    let videoId = '';
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || '';
      } else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    if (!videoId) {
      return NextResponse.json(
        { error: 'Could not extract video ID from URL' },
        { status: 400 }
      );
    }

    // First try: With language specification
    try {
      console.log('Attempting to fetch subtitles for:', videoId);
      const subtitles = await getSubtitles({
        videoID: videoId,
        lang: 'en'
      });
      
      if (subtitles && subtitles.length > 0) {
        console.log('Successfully retrieved subtitles with language specification');
        const transcript = subtitles.map((subtitle: Subtitle) => subtitle.text).join(' ');
        // Restore original fetch
        global.fetch = originalFetch;
        return NextResponse.json({ transcript });
      }
    } catch (error) {
      console.error('Error with language-specific getSubtitles:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        videoId
      });
    }

    // Second try: Without language specification
    try {
      console.log('Attempting to fetch subtitles without language specification for:', videoId);
      const subtitles = await getSubtitles({
        videoID: videoId
      });
      
      if (subtitles && subtitles.length > 0) {
        console.log('Successfully retrieved subtitles without language specification');
        const transcript = subtitles.map((subtitle: Subtitle) => subtitle.text).join(' ');
        // Restore original fetch
        global.fetch = originalFetch;
        return NextResponse.json({ transcript });
      }
    } catch (error) {
      console.error('Error with language-agnostic getSubtitles:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        videoId
      });
    }

    // Restore original fetch before returning error
    global.fetch = originalFetch;
    return NextResponse.json(
      { error: 'No captions found for this video' },
      { status: 404 }
    );
  } catch (error) {
    // Restore original fetch in case of error
    global.fetch = originalFetch;
    console.error('Error extracting YouTube captions:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error'
    });
    return NextResponse.json(
      { error: 'Failed to extract captions' },
      { status: 500 }
    );
  }
} 