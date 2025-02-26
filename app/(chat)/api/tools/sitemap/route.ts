import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { openai } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60; // Increase to 60 seconds for multi-level crawling

// Define interfaces for our data structures
interface IndexedLink {
  index: number;
  text: string;
  url: string;
  reason?: string;
}

interface PageData {
  title: string;
  url: string;
  links: Record<string, string | any[]>;
}

interface ExplorationResult {
  sitemap: string;
  title: string;
  url: string;
  linksToExplore?: IndexedLink[];
  debugInfo?: any;
  pagesExplored?: number;
}

// Helper function to normalize URLs for comparison
function normalizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Remove trailing slashes, convert to lowercase
    let normalized = url.toLowerCase().trim();
    
    // Remove protocol (http:// or https://)
    normalized = normalized.replace(/^https?:\/\//, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // Remove www. prefix
    normalized = normalized.replace(/^www\./, '');
    
    // Remove hash fragments
    normalized = normalized.replace(/#.*$/, '');
    
    return normalized;
  } catch (e) {
    console.error('Error normalizing URL:', url, e);
    return url || '';
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const includeDebug = searchParams.get('debug') === 'true';
  const exploreLinks = searchParams.get('explore') === 'true';
  const depth = parseInt(searchParams.get('depth') || '3', 10);

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Create debug info object if debugging is enabled
    const debugInfo = includeDebug ? {
      crawlSteps: [] as any[],
      error: null as string | null
    } : null;
    
    // Perform the multi-level crawl
    const result = await performMultiLevelCrawl(url, depth, exploreLinks, debugInfo);
    
    // Prepare the response with proper typing
    const response: {
      sitemap: string;
      title: string;
      url: string;
      linksToExplore?: IndexedLink[];
      debugInfo?: any;
      pagesExplored?: number;
    } = { 
      sitemap: result.sitemap,
      title: result.title,
      url: url,
      pagesExplored: result.pagesExplored
    };
    
    // Include links to explore if requested
    if (exploreLinks && result.linksToExplore) {
      response.linksToExplore = result.linksToExplore;
    }
    
    // Include debug info if requested
    if (includeDebug && result.debugInfo) {
      response.debugInfo = result.debugInfo;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return NextResponse.json({ 
      error: 'Failed to generate sitemap',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Main function to perform multi-level crawling
async function performMultiLevelCrawl(
  startUrl: string, 
  maxDepth: number, 
  exploreLinks: boolean,
  debugInfo: any
): Promise<ExplorationResult> {
  console.log(`Starting multi-level crawl of ${startUrl} with max depth ${maxDepth}`);
  
  // Track all unique URLs we've seen to avoid duplicates
  const seenUrls = new Set<string>([normalizeUrl(startUrl)]);
  
  // Track all pages we've fetched data for
  const allPageData: Record<string, PageData> = {};
  
  // Use a Map to track unique links by normalized URL
  // The Map key is the normalized URL, the value is the IndexedLink
  const linksMap = new Map<string, IndexedLink>();
  let nextLinkIndex = 0;
  
  // Start with the homepage
  const homepageData = await fetchPage(startUrl);
  allPageData[startUrl] = homepageData;
  
  // Convert homepage links to indexed array and add to the Map
  const homepageLinks = convertLinksToIndexedArray(homepageData.links);
  homepageLinks.forEach(link => {
    if (link.url) {
      const normalizedUrl = normalizeUrl(link.url);
      // Only add if we haven't seen this URL before and it's not empty
      if (normalizedUrl && !linksMap.has(normalizedUrl)) {
        linksMap.set(normalizedUrl, {
          ...link,
          index: nextLinkIndex++
        });
      }
    }
  });
  
  // Initialize the current level URLs with the homepage
  let currentLevelUrls = [startUrl];
  let pagesExplored = 1;
  
  // For each depth level
  for (let currentDepth = 1; currentDepth < maxDepth; currentDepth++) {
    if (debugInfo) {
      debugInfo.crawlSteps.push({
        depth: currentDepth,
        urlsToExplore: [...currentLevelUrls],
        linksFound: linksMap.size
      });
    }
    
    console.log(`Crawling depth ${currentDepth}/${maxDepth-1}, exploring ${currentLevelUrls.length} URLs`);
    
    // For each URL at the current level, identify links to explore
    const nextLevelUrls: string[] = [];
    
    for (const currentUrl of currentLevelUrls) {
      const currentPageData = allPageData[currentUrl];
      
      // Skip if we couldn't fetch this page
      if (!currentPageData) continue;
      
      // Get the links for this page
      const pageLinks = convertLinksToIndexedArray(currentPageData.links);
      
      // Add these links to our Map, deduplicating by URL
      pageLinks.forEach(link => {
        if (link.url) {
          const normalizedUrl = normalizeUrl(link.url);
          // Only add if we haven't seen this URL before and it's not empty
          if (normalizedUrl && !linksMap.has(normalizedUrl)) {
            linksMap.set(normalizedUrl, {
              ...link,
              index: nextLinkIndex++
            });
          }
        }
      });
      
      // For the AI, we need to provide the links with their current indices
      // We'll use the original page links but with updated indices from our map
      const currentPageLinksForAI = pageLinks.map(link => {
        const normalizedUrl = normalizeUrl(link.url);
        return normalizedUrl && linksMap.has(normalizedUrl) 
          ? linksMap.get(normalizedUrl)! 
          : link;
      });
      
      // Identify which links should be explored next
      const linksToExplore = await identifyLinksToExplore(
        currentPageData, 
        currentPageLinksForAI, 
        debugInfo ? { page: currentUrl, ...debugInfo } : null
      );
      
      // Add the URLs to explore to the next level, if we haven't seen them before
      for (const link of linksToExplore) {
        if (link.url) {
          const normalizedUrl = normalizeUrl(link.url);
          if (normalizedUrl && !seenUrls.has(normalizedUrl)) {
            nextLevelUrls.push(link.url);
            seenUrls.add(normalizedUrl);
          }
        }
      }
    }
    
    // Fetch all the pages for the next level
    const nextLevelPageData = await Promise.all(
      nextLevelUrls.map(async (url) => {
        try {
          return await fetchPage(url);
        } catch (error) {
          console.error(`Error fetching ${url}:`, error);
          return null;
        }
      })
    );
    
    // Add the successfully fetched pages to our collection
    nextLevelPageData.forEach((pageData, index) => {
      if (pageData) {
        const url = nextLevelUrls[index];
        allPageData[url] = pageData;
        pagesExplored++;
      }
    });
    
    // Update the current level URLs for the next iteration
    currentLevelUrls = nextLevelUrls.filter(url => allPageData[url] !== null);
    
    // If we have no more URLs to explore, break out of the loop
    if (currentLevelUrls.length === 0) {
      console.log(`No more URLs to explore at depth ${currentDepth}`);
      break;
    }
  }
  
  // Convert the Map values back to an array for the sitemap generation
  const allLinks = Array.from(linksMap.values());
  
  if (debugInfo) {
    debugInfo.uniqueLinksCount = allLinks.length;
    debugInfo.pagesExplored = pagesExplored;
  }
  
  // Generate the final sitemap using all the links we've found
  const sitemap = await generateComprehensiveSitemap(
    homepageData, 
    allLinks, 
    Object.values(allPageData),
    debugInfo
  );
  
  // If exploration is requested, identify links to explore from the homepage
  let homepageLinksToExplore: IndexedLink[] | undefined;
  
  if (exploreLinks) {
    // Use the deduplicated homepage links for exploration
    const dedupedHomepageLinks = homepageLinks.map(link => {
      const normalizedUrl = normalizeUrl(link.url);
      return normalizedUrl && linksMap.has(normalizedUrl) 
        ? linksMap.get(normalizedUrl)! 
        : link;
    });
    
    homepageLinksToExplore = await identifyLinksToExplore(homepageData, dedupedHomepageLinks, debugInfo);
  }
  
  return {
    title: homepageData.title,
    sitemap,
    url: startUrl,
    linksToExplore: homepageLinksToExplore,
    debugInfo,
    pagesExplored
  };
}

// Helper function to convert a links object to an indexed array
function convertLinksToIndexedArray(links: Record<string, string | any[]>, startIndex = 0): IndexedLink[] {
  return Object.entries(links).map(([text, url], index) => {
    // Handle the case where url is an array [text, url]
    let linkText = text;
    let linkUrl = url;
    
    if (Array.isArray(url)) {
      // If url is an array, use the second element as the actual URL
      // and the first element as the text if it's not empty
      linkUrl = url[1] || '';
      if (url[0] && typeof url[0] === 'string' && url[0].trim() !== '') {
        linkText = url[0];
      }
    }
    
    return {
      index: startIndex + index,
      text: linkText,
      url: typeof linkUrl === 'string' ? linkUrl : ''
    };
  });
}

// Helper function to fetch a page and extract its data
async function fetchPage(url: string): Promise<PageData> {
  console.log(`Fetching ${url}`);
  
  try {
    // Check if the URL is already a full URL
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    // Add a timeout to prevent hanging on slow responses
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`https://r.jina.ai/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-With-Links-Summary': 'all'
      },
      body: JSON.stringify({ url: fullUrl }),
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    
    const data = await response.json();
    const title = data.data?.title || '';
    const links = data.data?.links || {};
    
    console.log(`Found page: "${title}" with ${Object.keys(links).length} links`);
    
    // Filter out problematic links
    const filteredLinks: Record<string, string | any[]> = {};
    
    Object.entries(links).forEach(([text, linkUrl]) => {
      // Skip empty links or links with problematic text
      if (!linkUrl || text.includes('{') || text.includes('}')) {
        return;
      }
      
      filteredLinks[text] = linkUrl as string | any[];
    });
    
    return {
      title,
      url,
      links: filteredLinks
    };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    // Return a minimal page data object on error
    return {
      title: `Error: ${url}`,
      url,
      links: { "error": "Failed to fetch links" }
    };
  }
}

// Function to generate a comprehensive sitemap using AI
async function generateComprehensiveSitemap(
  homepageData: PageData, 
  allLinks: IndexedLink[], 
  allPages: PageData[],
  debugInfo: any
): Promise<string> {
  const prompt = `
You are a website information architect analyzing a website.

Your task is to create a comprehensive sitemap based on multiple pages that have been crawled.
Group related links together and organize them into a logical hierarchy.

Homepage Title: ${homepageData.title}
Homepage URL: ${homepageData.url}
Total Pages Crawled: ${allPages.length}

Format the sitemap using tabs to indicate hierarchy levels, like this:

${homepageData.title} (Homepage)
	About
    Team
      Team Member A
      Team Member B 
      Team Member C
    Our Mission
    Our Impact
    Partners
      Partner A
      Partner B
      Partner C
	Portfolio
		Case Study A
    Case Study B
	Services
		Branding
		Design
		Strategy
	Careers
		Job Post A
		Job Post B
	Blog
		Blog Post A
		Blog Post B
	Archives
	Contact Us
	Data Privacy

Guidelines:
1. Use your best judgment to determine which links represent main sections vs individual pages
2. Group similar pages under appropriate sections
3. Ignore social media links, email addresses, and duplicate links
4. Focus on the main navigation structure of the site
5. Start with the site name as the root node
6. Use the information from all crawled pages to build a more complete picture
`;

  const pagesInfo = allPages.map(page => `Page: ${page.title} (${page.url})`).join('\n');
  const fullPrompt = prompt + `\n\nPages crawled:\n${pagesInfo}\n\nAll links found:\n${JSON.stringify(allLinks, null, 2)}`;
  
  if (debugInfo) {
    debugInfo.sitemapPrompt = fullPrompt;
  }
  
  try {
    // Use generateText for a simple text-based sitemap
    const result = await generateText({
      model: openai('gpt-4o'),
      prompt: fullPrompt,
      temperature: 0.7,
      maxTokens: 1500,
    });
    
    if (debugInfo) {
      // Store the actual text response instead of the object
      debugInfo.sitemapResponse = result.text;
    }
    
    return result.text;
  } catch (e) {
    console.error('Error in sitemap generation:', e);
    
    if (debugInfo) {
      debugInfo.sitemapError = e instanceof Error ? e.message : 'Unknown error';
    }
    
    return `${homepageData.title}\n\t(Error generating sitemap)`;
  }
}

// Function to identify which links should be explored
async function identifyLinksToExplore(homepageData: any, indexedLinks: IndexedLink[], debugInfo: any): Promise<IndexedLink[]> {
  // Define the schema for link exploration
  const linkExplorationSchema = z.object({
    reasoning: z.string().describe("Explain your overall strategy for selecting these links and how they will help build a more complete sitemap"),
    linksToExplore: z.array(
      z.object({
        index: z.number().describe("The index of the link to explore")
      })
    ).describe("Links that should be explored to build a more complete sitemap")
  });
  
  // Filter out links that are likely not useful for sitemap exploration
  const filteredLinks = indexedLinks.filter(link => {
    if (!link.url) return false;
    
    const normalizedUrl = normalizeUrl(link.url);
    
    // Skip email links
    if (link.url.startsWith('mailto:')) return false;
    
    // Skip social media links
    if (normalizedUrl.includes('linkedin.com') || 
        normalizedUrl.includes('twitter.com') || 
        normalizedUrl.includes('facebook.com') ||
        normalizedUrl.includes('instagram.com') ||
        normalizedUrl.includes('youtube.com')) {
      return false;
    }
    
    // Skip links with no text
    if (!link.text || link.text.trim() === '') return false;
    
    // Skip links that are just numbers (often social media icons)
    if (/^\d+$/.test(link.text.trim())) return false;
    
    // Skip hash links (usually in-page navigation)
    if (link.url.startsWith('#') || link.url.endsWith('#')) return false;
    
    return true;
  });
  
  const prompt = `
You are a website information architect analyzing a website homepage to build a helpful sitemap.

Your task is to identify which links should be explored further to build a more complete sitemap.
First, provide your overall reasoning and strategy for the links you've selected.
Links to external websites should not be explored unless they seem absolutely necessary and highly relevant. 
Consider that if you see multiple links sharing the same structure, like /blog/how-to-write-code and /blog/how-to-manage-people, they probably don't need to both be explored, as they are likely variations of the same page. similarly, you don't need to explore /case-studies/case-study-1 and /case-studies/case-study-2, as they are likely variations of the same page.

Homepage Title: ${homepageData.title}
Homepage URL: ${homepageData.url}

Guidelines for selecting links to explore:
1. Focus on links that likely lead to important sections or categories
2. Prioritize links that would reveal the site's structure (like "Products", "Services", "Blog", "Insights", etc.)
3. Ignore social media links and email addresses - they cannot be explored
4. Select no more than 5 links to explore
5. First provide your overall reasoning for your selection strategy, then list the links to explore
6. IMPORTANT: If you see a link to a "Blog" or "Insights" section, ALWAYS include it as it likely contains important content
`;

  const fullPrompt = prompt + `\n\nLinks found on the homepage (with indices):\n${JSON.stringify(filteredLinks, null, 2)}`;
  
  if (debugInfo) {
    debugInfo.explorationPrompt = fullPrompt;
  }
  
  try {
    // Use generateObject to get structured data
    const result = await generateObject({
      model: openai('gpt-4o'),
      prompt: fullPrompt,
      schema: linkExplorationSchema,
      temperature: 0.5,
    });
    
    if (debugInfo) {
      debugInfo.explorationResponse = JSON.stringify(result.object, null, 2);
    }
    
    // Map the results back to the original indexed links
    const linksToExplore = result.object.linksToExplore.map(item => {
      const link = indexedLinks.find(l => l.index === item.index);
      if (!link) {
        throw new Error(`Link with index ${item.index} not found`);
      }
      console.log(`Exploring link: ${link.url} (${link.text})`);
      return {
        ...link,
        reason: result.object.reasoning // Add the overall reasoning to each link
      };
    });
    
    return linksToExplore;
  } catch (e) {
    console.error('Error identifying links to explore:', e);
    
    if (debugInfo) {
      debugInfo.explorationError = e instanceof Error ? e.message : 'Unknown error';
    }
    
    return [];
  }
}
