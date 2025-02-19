import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoaderIcon } from '@/components/icons';
import { Clipboard } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export function YoutubeTranscriptTool() {
  const { data: session } = useSession();
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const fetchVideoId = (url: string) => {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error('Please sign in to add resources');
      return;
    }

    if (!url) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    const id = fetchVideoId(url);
    if (!id) {
      toast.error('Invalid YouTube URL');
      return;
    }

    setVideoId(id);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/tools/youtube?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transcript');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setTranscript(data.transcript);
      setVideoTitle(data.title);
      setThumbnailUrl(data.thumbnailUrl);

      // Automatically save the resource
      const saveResponse = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          type: 'video',
          url,
          thumbnailUrl: data.thumbnailUrl,
          transcript: data.transcript,
          userId: session.user.id,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save resource');
      }

      toast.success('Resource added successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
      toast.error('Failed to add resource');
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('youtube.com') || text.includes('youtu.be')) {
        setUrl(text);
        toast.success('URL pasted from clipboard');
      } else {
        toast.error('No YouTube URL found in clipboard');
      }
    } catch (error) {
      toast.error('Failed to read from clipboard');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-center">YouTube Transcript Tool</h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Add YouTube videos as resources with their transcripts.
      </p>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="Enter YouTube URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={pasteFromClipboard}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                <Clipboard className="size-4" />
                Paste from clipboard
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
              >
                {isLoading ? (
                  <>
                    <LoaderIcon size={16} />
                    Adding Resource...
                  </>
                ) : (
                  'Add Resource'
                )}
              </Button>
            </div>
          </div>
        </form>

        {videoId && (
          <div className="mt-6">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 size-full"
              ></iframe>
            </div>
          </div>
        )}

        {transcript && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Transcript Preview</h3>
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
              {transcript}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
} 