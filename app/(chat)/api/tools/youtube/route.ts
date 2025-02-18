import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

interface TranscriptSegment {
  offset: number;
  duration: number;
  text: string;
}

// Convert milliseconds to MM:SS format
function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Clean up text by replacing HTML entities and other common issues
function cleanText(text: string): string {
  return text
    .replace(/&amp;#39;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&amp;amp;/g, '&')
    .replace(/&amp;lt;/g, '<')
    .replace(/&amp;gt;/g, '>')
    .trim();
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract video ID from URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Format transcript into a readable string with cleaned text and formatted time
    const formattedTranscript = transcript
      .map((segment: TranscriptSegment) => `[${formatTime(segment.offset)}] ${cleanText(segment.text)}`)
      .join('\n');

    return NextResponse.json({ transcript: formattedTranscript });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}

function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Handle youtube.com URLs
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    // Handle youtu.be URLs
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    return null;
  } catch {
    return null;
  }
}
