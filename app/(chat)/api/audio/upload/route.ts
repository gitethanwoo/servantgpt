import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const AudioFileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 25 * 1024 * 1024, {
      message: 'File size should be less than 25MB',
    })
    .refine((file) => {
      const audioTypes = [
        'audio/mp3',
        'audio/mp4',
        'audio/mpeg',
        'audio/mpga',
        'audio/m4a',
        'audio/wav',
        'audio/webm',
        'audio/x-m4a',           // Common M4A MIME type
        'audio/aac',             // Another possible M4A MIME type
        'audio/x-wav',           // Alternative WAV MIME type
        'audio/vnd.wave',        // Another WAV variant
        'application/octet-stream' // Fallback for some audio files
      ];
      console.log('File type:', file.type); // For debugging
      return audioTypes.includes(file.type.toLowerCase());
    }, {
      message: 'File must be an audio file (MP3, MP4, M4A, WAV, WEBM)',
    }),
});

export async function POST(request: Request) {
  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = AudioFileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get('file') as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(`audio/${filename}`, fileBuffer, {
        access: 'public',
      });

      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
} 