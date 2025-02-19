import { NextResponse } from 'next/server';
import { getResourceById } from '@/lib/db/queries';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resource = await getResourceById(params.id);
    
    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(resource);
  } catch (error) {
    console.error('Failed to get resource:', error);
    return NextResponse.json(
      { error: 'Failed to get resource' },
      { status: 500 }
    );
  }
} 