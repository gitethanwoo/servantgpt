import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoaderIcon, CopyIcon } from '@/components/icons';
import { Clipboard } from 'lucide-react';
import { toast } from 'sonner';

export function YoutubeTranscriptTool() {
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchTranscript = async (urlToFetch: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tools/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToFetch }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transcript');
      }

      setTranscript(data.transcript);
      toast.success('Transcript fetched successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch transcript');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    await fetchTranscript(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcript);
    toast.success('Copied to clipboard');
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('youtube.com') || text.includes('youtu.be')) {
        setUrl(text);
        toast.success('URL pasted from clipboard');
        await fetchTranscript(text);
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
                  'Get Transcript'
                )}
              </Button>
            </div>
          </div>
        </form>

        {transcript && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Transcript</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <CopyIcon />
                Copy
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-4 bg-muted rounded-lg whitespace-pre-wrap">
              {transcript}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
} 