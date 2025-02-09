import { NextResponse } from 'next/server';
import { getSubtitles } from '@treeee/youtube-caption-extractor';

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

    const subtitles = await getSubtitles({
      videoID: videoId,
      lang: 'en' // Default to English
    });
    
    if (!subtitles || subtitles.length === 0) {
      return NextResponse.json(
        { error: 'No captions found for this video' },
        { status: 404 }
      );
    }

    // Combine all subtitle text into a single transcript
    const transcript = subtitles.map(subtitle => subtitle.text).join(' ');

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Error extracting YouTube captions:', error);
    return NextResponse.json(
      { error: 'Failed to extract captions' },
      { status: 500 }
    );
  }
} 