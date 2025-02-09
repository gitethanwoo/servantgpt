import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const { audioUrl } = await request.json();
    
    // Call Deepgram API with smart parameters and the blob URL directly
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true&diarize=true&paragraphs=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: audioUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Deepgram API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Get the full response data including paragraphs
    const result = {
      text: data.results?.channels[0]?.alternatives[0]?.transcript || '',
      paragraphs: data.results?.channels[0]?.alternatives[0]?.paragraphs?.paragraphs || []
    };
    
    // Delete the blob after successful transcription
    try {
      await del(audioUrl);
    } catch (deleteError) {
      console.error('Failed to delete blob:', deleteError);
      // Don't throw here, as we still want to return the transcription
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: 'Failed to transcribe file'
    }, { status: 500 });
  }
}