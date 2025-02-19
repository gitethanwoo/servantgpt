import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoaderIcon, CopyIcon } from '@/components/icons';
import { Clipboard } from 'lucide-react';
import { toast } from 'sonner';

export function YoutubeTranscriptTool() {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    
    if (!url) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    const id = fetchVideoId(url);
    if (id) {
      setVideoId(id);
      toast.success('Video embedded successfully');
    } else {
      toast.error('Invalid YouTube URL');
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
        Extract transcripts from YouTube videos. Note: this tool is not working in production as of Monday, February 10. 
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
                    Loading...
                  </>
                ) : (
                  'Embed Video'
                )}
              </Button>
            </div>
          </div>
        </form>

        {videoId && (
          <div className="mt-6">
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 