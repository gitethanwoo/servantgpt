import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { openai } from '@ai-sdk/openai';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

// Define interfaces for our data structures
interface Link {
  text: string;
  url: string;
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
  pagesExplored: number;
  description?: string;
}

// Helper function to normalize URLs for comparison
function normalizeUrl(url: string): string {
  if (!url) return '';
  
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
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Generate sitemap using the simplified approach
  const result = await generateSitemap(url);
  
  // Prepare the response
  const response = { 
    sitemap: result.sitemap,
    title: result.title,
    url: url,
    pagesExplored: result.pagesExplored,
    description: result.description
  };
  
  return NextResponse.json(response);
}

// Main function to generate a sitemap
async function generateSitemap(startUrl: string): Promise<ExplorationResult> {
  // Step 1: Fetch the main page
  const mainPage = await fetchPage(startUrl);
  
  // Step 2: Convert links to a more usable format
  const mainPageLinks = convertLinksToArray(mainPage.links);
  
  // Step 3: Ask AI which links to explore
  const linksToExplore = await identifyLinksToExplore(mainPage, mainPageLinks);
  
  // Step 4: Fetch the selected pages in parallel
  const allPages: PageData[] = [mainPage];
  let pagesExplored = 1;
  
  if (linksToExplore.length > 0) {
    const pagePromises = linksToExplore.map(link => fetchPage(link.url));
    const exploredPages = await Promise.allSettled(pagePromises);
    
    // Add successfully fetched pages to our collection
    exploredPages.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allPages.push(result.value);
        pagesExplored++;
      }
    });
  }
  
  // Step 5: Generate the sitemap using all collected data
  const sitemapResult = await generateComprehensiveSitemap(mainPage, allPages);
  
  return {
    title: mainPage.title,
    sitemap: sitemapResult.sitemap,
    description: sitemapResult.description,
    url: startUrl,
    pagesExplored
  };
}

// Helper function to convert a links object to an array
function convertLinksToArray(links: Record<string, string | any[]>): Link[] {
  return Object.entries(links).map(([text, url]) => {
    // Handle the case where url is an array [text, url]
    let linkText = text;
    let linkUrl = url;
    
    if (Array.isArray(url)) {
      linkUrl = url[1] || '';
      if (url[0] && typeof url[0] === 'string' && url[0].trim() !== '') {
        linkText = url[0];
      }
    }
    
    return {
      text: linkText,
      url: typeof linkUrl === 'string' ? linkUrl : ''
    };
  });
}

// Helper function to fetch a page and extract its data
async function fetchPage(url: string): Promise<PageData> {
  // Check if the URL is already a full URL
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;
  
  // Add a timeout to prevent hanging on slow responses
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
  
  try {
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
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    const title = data.data?.title || '';
    const links = data.data?.links || {};
    
    return {
      title,
      url,
      links: links
    };
  } catch (error) {
    console.error(`Error fetching page ${url}:`, error);
    return {
      title: '',
      url,
      links: {}
    };
  }
}

// Function to generate a comprehensive sitemap using AI
async function generateComprehensiveSitemap(
  mainPage: PageData, 
  allPages: PageData[]
): Promise<{ sitemap: string; description: string }> {
  // Enhanced link structure that tracks source pages
  interface EnhancedLink extends Link {
    sourcePages: string[];  // URLs of pages where this link was found
    isOnHomepage: boolean;  // Flag if link appears on homepage
  }
  
  // Collect links from all pages and deduplicate by URL
  const uniqueLinksMap = new Map<string, EnhancedLink>();
  const pageLinksMap: Record<string, Link[]> = {};
  
  // Process each page and collect its links
  allPages.forEach(page => {
    const pageLinks = convertLinksToArray(page.links);
    pageLinksMap[page.url] = pageLinks;
    const isHomepage = page.url === mainPage.url;
    
    // Add each link to our map, using normalized URL as the key
    pageLinks.forEach(link => {
      if (link.url) {
        const normalizedUrl = normalizeUrl(link.url);
        if (normalizedUrl) {
          if (!uniqueLinksMap.has(normalizedUrl)) {
            // First time seeing this URL - create new enhanced link
            uniqueLinksMap.set(normalizedUrl, {
              text: link.text,
              url: link.url,
              sourcePages: [page.url],
              isOnHomepage: isHomepage
            });
          } else {
            // We've seen this URL before - update existing entry
            const existingLink = uniqueLinksMap.get(normalizedUrl)!;
            
            // Add this page to the sourcePages if not already there
            if (!existingLink.sourcePages.includes(page.url)) {
              existingLink.sourcePages.push(page.url);
            }
            
            // Update isOnHomepage flag if needed
            if (isHomepage) {
              existingLink.isOnHomepage = true;
            }
            
            // Keep the link with the most descriptive text
            if (link.text.length > existingLink.text.length) {
              existingLink.text = link.text;
            }
          }
        }
      }
    });
  });
  
  // Convert the map back to an array of unique links
  const uniqueLinks = Array.from(uniqueLinksMap.values());
  
  // Create a map of page titles by URL for easier reference
  const pageTitlesByUrl: Record<string, string> = {};
  allPages.forEach(page => {
    pageTitlesByUrl[page.url] = page.title;
  });
  
  // Define the schema for the sitemap output
  const sitemapSchema = z.object({
    description: z.string().describe(
      "A concise explanation of the website's purpose and overall structure based on the analyzed pages. " +
      "Include observations about the main sections, content types, and organization of the site."
    ),
    sitemap: z.string().describe(
      "A tab-indented hierarchical sitemap showing the structure of the website. " +
      "Each level of hierarchy should be indented with tabs. " +
      "The root node should be the site name, followed by main sections and their subsections."
    )
  });
  
  const prompt = `
You are a website information architect analyzing a website.

Your task is to create a comprehensive sitemap based on multiple pages that have been crawled.
Group related links together and organize them into a logical hierarchy.

Homepage Title: ${mainPage.title}
Homepage URL: ${mainPage.url}
Total Pages Crawled: ${allPages.length}
Total Unique Links Found: ${uniqueLinks.length}

You will provide TWO outputs:
1. A description of the website's purpose and overall structure
2. A tab-indented hierarchical sitemap

For the sitemap, format it using tabs to indicate hierarchy levels, like this:

${mainPage.title} (Homepage)
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
3. Ignore social media links and email addresses
4. Focus on the main navigation structure of the site
5. Start with the site name as the root node
6. Use the information from all crawled pages to build a more complete picture
7. IMPORTANT: Include all content articles, blog posts, and insights articles under their respective sections
8. For the Insights section, make sure to list all individual insight articles found on that page
9. Pay special attention to links found on the homepage - these are likely main navigation items
`;

  // Create a detailed summary of pages explored
  const pagesSummary = allPages.map(page => {
    return `Page: ${page.title} (${page.url}) - ${pageLinksMap[page.url]?.length || 0} links found`;
  }).join('\n');
  
  // Enhance link information with source page details
  const enhancedLinks = uniqueLinks.map(link => {
    // Convert source page URLs to page titles for better readability
    const sourcePagesInfo = link.sourcePages.map(pageUrl => {
      const pageTitle = pageTitlesByUrl[pageUrl] || pageUrl;
      return pageUrl === mainPage.url ? `${pageTitle} (Homepage)` : pageTitle;
    }).join(", ");
    
    return {
      text: link.text,
      url: link.url,
      foundOn: sourcePagesInfo,
      isOnHomepage: link.isOnHomepage
    };
  });
  
  // Create the full prompt with all unique links and their source information
  const fullPrompt = prompt + 
    `\n\nPages crawled:\n${pagesSummary}\n\n` + 
    `All unique links found (${uniqueLinks.length}) with their source pages:\n${JSON.stringify(enhancedLinks, null, 2)}`;
  
  // Use generateObject for structured output
  const result = await generateObject({
    model: openai('gpt-4o'),
    prompt: fullPrompt,
    schema: sitemapSchema,
    temperature: 0.7,
  });
  
  // Return both the sitemap and description
  return {
    sitemap: result.object.sitemap,
    description: result.object.description
  };
}

// Function to identify which links should be explored
async function identifyLinksToExplore(
  pageData: PageData, 
  links: Link[]
): Promise<Link[]> {
  // Define the schema for link exploration
  const linkExplorationSchema = z.object({
    reasoning: z.string().describe("Explain your overall strategy for selecting these links and how they will help build a more complete sitemap"),
    linksToExplore: z.array(
      z.object({
        url: z.string().describe("The URL of the link to explore"),
        reason: z.string().optional().describe("Why this link was selected")
      })
    ).describe("Links that should be explored to build a more complete sitemap")
  });
  
  const prompt = `
You are a website information architect analyzing a webpage to build a helpful sitemap.

Your task is to identify which links should be explored further to build a more complete sitemap. First, provide your overall reasoning and strategy for the links you've selected.

Current Page Title: ${pageData.title}
Current Page URL: ${pageData.url}

Select no more than 5 links total

Guidelines for selecting links to explore:
- Focus on links that likely lead to important content or categories
- Ignore social media links, email addresses
- PREFER content links that contain terms like "article", "post", "case study", "project", etc.
- If this is an Insights or Blog page, prioritize selecting individual article links
- For content sections (like Insights, Blog, Resources), try to select a diverse sample of content articles
`;

  const fullPrompt = prompt + `\n\nLinks found on the page:\n${JSON.stringify(links, null, 2)}`;
  
  // Use generateObject to get structured data
  const result = await generateObject({
    model: openai('gpt-4o'),
    prompt: fullPrompt,
    schema: linkExplorationSchema,
    temperature: 0.7,
  });
  
  // Return the links to explore
  return result.object.linksToExplore.map(item => ({
    text: item.reason || '',
    url: item.url
  }));
}
