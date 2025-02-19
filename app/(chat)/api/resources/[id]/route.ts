import { getResourceById } from '@/lib/db/queries';

export async function GET({ params }: { params: { id: string } }) {
  try {
    const resource = await getResourceById(params.id);
    
    if (!resource) {
      return Response.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return Response.json(resource);
  } catch (error) {
    console.error('Failed to get resource:', error);
    return Response.json(
      { error: 'Failed to get resource' },
      { status: 500 }
    );
  }
} 