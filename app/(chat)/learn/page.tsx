import { Suspense } from 'react';
import { getResources } from '@/lib/db/queries';
import { ResourceCard } from '@/components/resource-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


function Pagination({ totalPages, currentPage }: { totalPages: number; currentPage: number }) {
  return (
    <div className="flex justify-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link href={`/learn?page=${currentPage - 1}`}>
          <Button variant="outline">Previous</Button>
        </Link>
      )}
      {currentPage < totalPages && (
        <Link href={`/learn?page=${currentPage + 1}`}>
          <Button variant="outline">Next</Button>
        </Link>
      )}
    </div>
  );
}

async function ResourceGrid({ page }: { page: number }) {
  const { resources, totalPages, currentPage } = await getResources(page);

  if (!resources.length) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">No resources found</h2>
        <p className="text-muted-foreground">
          Start by adding a YouTube video or other learning resource.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
      <Pagination totalPages={totalPages} currentPage={currentPage} />
    </>
  );
}

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Learning Resources</h1>
        <Button asChild>
          <Link href="/chat">Add Resource</Link>
        </Button>
      </div>
      <Suspense 
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-[300px] rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        }
      >
        <ResourceGrid page={page} />
      </Suspense>
    </div>
  );
} 