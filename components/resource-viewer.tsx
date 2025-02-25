import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Resource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'podcast';
  url: string;
  thumbnailUrl: string | null;
  transcript: string | null;
  summary: string | null;
  tags: unknown;
  tagline: string | null;
  userId: string;
  createdAt: Date;
}

interface ResourceViewerProps {
  resource: Resource;
  hideTranscript?: boolean;
}

function getYouTubeEmbedUrl(url: string) {
  const videoId = url.includes('youtu.be')
    ? url.split('youtu.be/')[1]?.split('?')[0]
    : url.split('v=')[1]?.split('&')[0];
  return `https://www.youtube.com/embed/${videoId}`;
}

function VideoEmbed({ url }: { url: string }) {
  const embedUrl = getYouTubeEmbedUrl(url);
  
  return (
    <div className="aspect-video w-full">
      <iframe
        src={embedUrl}
        className="size-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function TranscriptViewer({ transcript }: { transcript: string }) {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-1">
        {transcript.split('\n').map((line, index) => {
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
  );
}

export function ResourceViewer({ resource, hideTranscript = false }: ResourceViewerProps) {
  const tags = resource.tags as string[] | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{resource.title}</h1>
            {resource.tagline && (
              <p className="text-muted-foreground mt-1">{resource.tagline}</p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0">
            {resource.type}
          </Badge>
        </div>
        {tags && tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        <VideoEmbed url={resource.url} />
        {resource.summary && (
          <div className="prose dark:prose-invert max-w-none mt-6">
            <h2 className="text-xl font-semibold mb-2">Summary</h2>
            <p>{resource.summary}</p>
          </div>
        )}
        
        {resource.transcript && !hideTranscript && (
          <div className="space-y-2 mt-6">
            <h2 className="text-xl font-semibold">Transcript</h2>
            <TranscriptViewer transcript={resource.transcript} />
          </div>
        )}
      </div>
    </div>
  );
} 