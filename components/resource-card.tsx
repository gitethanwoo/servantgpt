import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export function ResourceCard({ resource }: { resource: Resource }) {
  const tags = resource.tags as string[] | undefined;
  
  return (
    <Link href={`/learn/${resource.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        {resource.thumbnailUrl && (
          <div className="aspect-video relative overflow-hidden rounded-t-lg">
            <Image
              src={resource.thumbnailUrl}
              alt={resource.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight line-clamp-2">
              {resource.title}
            </h3>
            <Badge variant="outline" className="shrink-0">
              {resource.type}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {resource.tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {resource.tagline}
            </p>
          )}
        </CardContent>
        {tags && tags.length > 0 && (
          <CardFooter className="flex gap-2 flex-wrap">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </CardFooter>
        )}
      </Card>
    </Link>
  );
} 