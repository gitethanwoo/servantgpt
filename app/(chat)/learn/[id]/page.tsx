import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getResourceById } from '@/lib/db/queries';
import { ResourceViewer } from '@/components/resource-viewer';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

async function Resource({ id }: { id: string }) {
  const resource = await getResourceById(id);

  if (!resource) {
    notFound();
  }

  return <ResourceViewer resource={resource} />;
}

export default async function ResourcePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/learn" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Resources
          </Link>
        </Button>
      </div>
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="aspect-video w-full bg-muted rounded animate-pulse" />
          </div>
        }
      >
        <Resource id={params.id} />
      </Suspense>
    </div>
  );
} 