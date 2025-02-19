import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { saveResource } from '@/lib/db/queries';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, type, url, thumbnailUrl, transcript, summary, tags, tagline } = body;

    if (!title || !type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await saveResource({
      title,
      type,
      url,
      thumbnailUrl,
      transcript,
      summary,
      tags,
      tagline,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Failed to save resource:', error);
    return NextResponse.json(
      { error: 'Failed to save resource' },
      { status: 500 }
    );
  }
} 