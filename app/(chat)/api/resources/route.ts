import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { saveResource, getResources } from '@/lib/db/queries';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await getResources(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get resources:', error);
    return NextResponse.json(
      { error: 'Failed to get resources' },
      { status: 500 }
    );
  }
}

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