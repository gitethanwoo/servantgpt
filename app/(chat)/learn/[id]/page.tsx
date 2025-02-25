import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getResourceById } from '@/lib/db/queries';
import { ResourceViewer } from '@/components/resource-viewer';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { ResourceChat } from '@/components/resource-chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { ScrollArea } from '@/components/ui/scroll-area';

async function Resource({ id }: { id: string }) {
  const resource = await getResourceById(id);
  const chatId = `resource-${id}`;

  if (!resource) {
    notFound();
  }

  // Function to render the transcript section
  const renderTranscript = () => {
    if (!resource.transcript) return null;
    
    return (
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Transcript</h2>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-1">
            {resource.transcript.split('\n').map((line, index) => {
              const [timestamp, ...textParts] = line.split('] ');
              const text = textParts.join('] ');
              
              return (
                <div key={index} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground whitespace-nowrap">
                    {timestamp.replace('[', '')}
                  </span>
                  <span>{text}</span>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div>
      {/* Mobile layout (stacked) */}
      <div className="xl:hidden space-y-6">
        {/* 1. Video */}
        <ResourceViewer resource={resource} hideTranscript={true} />
        
        {/* 2. Chat */}
        {resource.transcript && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Ask about this resource</h2>
            <ResourceChat 
              resourceId={resource.id} 
              transcript={resource.transcript} 
              title={resource.title} 
              chatId={chatId}
            />
            <DataStreamHandler id={chatId} />
          </div>
        )}
        
        {/* 3. Transcript */}
        {resource.transcript && (
          <div>
            {renderTranscript()}
          </div>
        )}
      </div>
      
      {/* Desktop layout (side by side) */}
      <div className="hidden xl:flex gap-6">
        {/* Left column - video and transcript */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Video */}
          <ResourceViewer resource={resource} hideTranscript={true} />
          
          {/* Transcript below video */}
          {resource.transcript && (
            <div>
              {renderTranscript()}
            </div>
          )}
        </div>
        
        {/* Right column - chat */}
        {resource.transcript && (
          <div className="w-[400px] flex-shrink-0">
            <h2 className="text-xl font-semibold mb-4">Ask about this resource</h2>
            <ResourceChat 
              resourceId={resource.id} 
              transcript={resource.transcript} 
              title={resource.title} 
              chatId={chatId}
            />
            <DataStreamHandler id={chatId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <div className="container max-w-screen-2xl mx-auto p-6">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/learn" className="flex items-center gap-2">
            <ChevronLeft className="size-4" />
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
        <Resource id={id} />
      </Suspense>
    </div>
  );
} 