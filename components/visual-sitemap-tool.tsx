// components/visual-sitemap-tool.tsx

'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoaderIcon, CopyIcon } from '@/components/icons';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function VisualSitemapTool() {
  const { data: session } = useSession();
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [sitemapData, setSitemapData] = useState('');
  const [siteInfo, setSiteInfo] = useState<{ 
    title: string; 
    url: string; 
    pagesDiscovered: number;
    pagesExplored?: number;
  } | null>(null);
  const [error, setError] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [exploreMode, setExploreMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [linksToExplore, setLinksToExplore] = useState<any[]>([]);

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
    setLinksToExplore([]);
    
    try {
      // Build the API URL with query parameters
      let apiUrl = `/api/tools/sitemap?url=${encodeURIComponent(processedUrl)}`;
      
      // Add debug and explore parameters if enabled
      if (debugMode) apiUrl += '&debug=true';
      if (exploreMode) apiUrl += '&explore=true';
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate sitemap: ${response.status}`);
      }
      
      const data = await response.json();
      setSitemapData(data.sitemap);
      setSiteInfo({
        title: data.title || '',
        url: data.url || '',
        pagesDiscovered: data.linksToExplore?.length || 0,
        pagesExplored: data.pagesExplored || 1
      });
      
      // Set debug info if available
      if (data.debugInfo) {
        setDebugInfo(data.debugInfo);
      }
      
      // Set links to explore if available
      if (data.linksToExplore) {
        setLinksToExplore(data.linksToExplore);
      }
      
      toast.success('Sitemap generated successfully');
    } catch (err) {
      console.error('Error:', err);
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
            
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Crawl Depth:</label>
                <span className="text-xs text-muted-foreground">
                  {depth === 1 ? 'Faster, less complete' : depth >= 3 ? 'Slower, more complete' : 'Balanced'}
                </span>
              </div>
              <Input
                type="number"
                min={1}
                max={5}
                value={depth}
                onChange={(e) => setDepth(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                className="mb-2"
              />
              <div className="text-xs text-muted-foreground">
                Higher depth values (1-5) will crawl more pages but take longer to complete.
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="debug-mode" 
                  checked={debugMode} 
                  onCheckedChange={setDebugMode} 
                />
                <Label htmlFor="debug-mode">Debug Mode</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="explore-mode" 
                  checked={exploreMode} 
                  onCheckedChange={setExploreMode} 
                />
                <Label htmlFor="explore-mode">Identify Links to Explore</Label>
              </div>
            </div>
            
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
            {error}
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
                {siteInfo.pagesDiscovered > 0 && (
                  <p><strong>Links identified for exploration:</strong> {siteInfo.pagesDiscovered}</p>
                )}
              </div>
            )}
            
            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
              <pre className="whitespace-pre text-sm font-mono">
                {sitemapData}
              </pre>
            </div>
            
            {linksToExplore.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Links to Explore</h3>
                <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[300px]">
                  <ul className="space-y-3">
                    {linksToExplore.map((link, i) => (
                      <li key={i} className="border-b border-border pb-2 last:border-0 last:pb-0">
                        <div className="font-medium">{link.text}</div>
                        <div className="text-xs text-muted-foreground mb-1">{link.url}</div>
                        {link.reason && (
                          <div className="text-sm italic">Reason: {link.reason}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {debugInfo && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
                <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[300px]">
                  <pre className="whitespace-pre-wrap text-xs font-mono">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
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