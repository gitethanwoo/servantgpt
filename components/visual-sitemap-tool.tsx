// components/visual-sitemap-tool.tsx

'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoaderIcon, CopyIcon } from '@/components/icons';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

export function VisualSitemapTool() {
  const { data: session } = useSession();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sitemapData, setSitemapData] = useState('');
  const [siteInfo, setSiteInfo] = useState<{ 
    title: string; 
    url: string; 
    pagesDiscovered: number;
    pagesExplored?: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error('Please sign in to use this tool');
      return;
    }

    if (!url) {
      toast.error('Please enter a website URL');
      return;
    }

    // Prepare URL - add https:// if no protocol is specified
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = `https://${processedUrl}`;
    }

    // Validate URL
    try {
      new URL(processedUrl);
    } catch (e) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setSitemapData('');
    setSiteInfo(null);
    setDebugInfo(null);
    
    try {
      // Use depth 2 by default which is sufficient for most sites
      const apiUrl = `/api/tools/sitemap?url=${encodeURIComponent(processedUrl)}&depth=2`;
      
      console.log('Fetching sitemap from:', apiUrl);
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('API response:', data);
      
      // Check if the API returned an error
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (!data.sitemap) {
        throw new Error('No sitemap data returned');
      }
      
      // Store the complete response for debugging
      setDebugInfo(data);
      
      // Set the sitemap data and site info
      setSitemapData(data.sitemap);
      setSiteInfo({
        title: data.title || processedUrl,
        url: data.url || processedUrl,
        pagesDiscovered: 0,
        pagesExplored: data.pagesExplored || 1
      });
      
      toast.success('Sitemap generated successfully');
    } catch (err) {
      console.error('Error generating sitemap:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to generate sitemap');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!sitemapData) return;
    
    navigator.clipboard.writeText(sitemapData);
    toast.success('Copied to clipboard! Paste into the Visual Sitemap plugin in Figma');
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-center">Visual Sitemap Generator</h1>
      <p className="text-sm text-center text-muted-foreground mb-6">
        Generate a visual sitemap for any website and export to Figma
      </p>

      <Card className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter website URL (e.g., servant.io or https://servant.io)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2">
                    <LoaderIcon size={16} />
                  </div>
                  Crawling Website...
                </>
              ) : (
                'Generate Sitemap'
              )}
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            
            {debugInfo && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">Show technical details</summary>
                <pre className="mt-2 text-xs overflow-auto p-2 bg-red-100 rounded">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {sitemapData && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Sitemap Result</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <CopyIcon size={16} />
                Copy for Figma
              </Button>
            </div>
            
            {siteInfo && (
              <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                <p><strong>Site:</strong> {siteInfo.title}</p>
                <p><strong>URL:</strong> {siteInfo.url}</p>
                {siteInfo.pagesExplored && siteInfo.pagesExplored > 1 && (
                  <p><strong>Pages explored:</strong> {siteInfo.pagesExplored}</p>
                )}
              </div>
            )}
            
            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
              <pre className="whitespace-pre text-sm font-mono">
                {sitemapData}
              </pre>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <p className="font-medium mb-2">How to use in Figma:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Install the &quot;Visual Sitemap&quot; plugin in Figma</li>
                <li>Open the plugin</li>
                <li>Paste the copied text into the plugin&apos;s editor</li>
                <li>Click &quot;Create&quot; to generate your visual sitemap</li>
              </ol>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}