import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { audioUrl } = await request.json();
    
    // Download the file from the URL
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();
    
    // Convert blob to array buffer for Deepgram
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Call Deepgram API with smart parameters
    const response = await fetch('https://api.deepgram.com/v1/listen?smart_format=true&punctuate=true&diarize=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': audioBlob.type || 'audio/mpeg',
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      throw new Error('Transcription failed');
    }

    const data = await response.json();
    const transcription = data.results?.channels[0]?.alternatives[0]?.transcript || '';
    
    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: 'Failed to transcribe file'
    }, { status: 500 });
  }
}