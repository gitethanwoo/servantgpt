import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { audioUrl } = await request.json();
    
    // Download the file from the URL
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();
    
    // Create form data with the downloaded file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.mp3'); // Add filename as third parameter
    formData.append('model', 'whisper-large-v3');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: 'Failed to transcribe',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}