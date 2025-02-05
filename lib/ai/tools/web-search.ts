import { tool, generateText } from 'ai';
import { z } from 'zod';
import { customModel } from '..';
import { Citation } from '@/components/citations';

interface PerplexityMetadata {
  citations: string[];  // Array of URLs
  usage: {
    citationTokens: number;
    numSearchQueries: number;
  };
}

interface PerplexityResult {
  text: string;
  experimental_providerMetadata?: {
    perplexity?: PerplexityMetadata;
  };
}

export interface WebSearchResult {
  text: string;
  citations: Citation[];
}

export const webSearch = tool({
  description: 'Perform a web search and return results with citations using Perplexity',
  parameters: z.object({
    query: z.string().describe('The search query to look up'),
  }),
  execute: async ({ query }) => {
    console.log('🔍 Web Search Query:', query);

    const result = await generateText({
      model: customModel('sonar-pro', 'perplexity'),
      system: `You are a web search assistant focused on providing accurate, current information. 
When searching:
- Focus on recent, authoritative sources
- Prioritize official websites, reputable news sources, and academic publications
- Include specific dates and timeframes when available
- Synthesize information from multiple sources
- Be clear about any uncertainties or conflicting information
- Format citations properly for source verification

Your response should:
1. Directly answer the query with current information
2. Provide relevant context and background
3. Highlight key findings or trends
4. Include dates for time-sensitive information
5. Cite specific sources for claims made`,
      prompt: `Search query: ${query}\n\nProvide a clear summary of the latest information, focusing on accuracy and citing sources.`,
      providerOptions: {
        perplexity: {
          experimental_providerMetadata: true
        }
      }
    }) as PerplexityResult;

    console.log('📝 Raw Perplexity Result:', result);
    console.log('🔗 Provider Metadata:', result.experimental_providerMetadata?.perplexity);

    // Return structured data for the UI to handle
    if (typeof result === 'string') {
      console.log('⚠️ Result is string:', result);
      return {
        text: result,
        citations: []
      } as WebSearchResult;
    }

    const citations = (result.experimental_providerMetadata?.perplexity?.citations || [])
      .map((url, i) => {
        // Extract domain name for the citation text
        try {
          const domain = new URL(url).hostname.replace('www.', '');
          return {
            id: i + 1,
            url: url,
            text: domain
          };
        } catch (e) {
          return {
            id: i + 1,
            url: url,
            text: 'Source ' + (i + 1)
          };
        }
      });

    console.log('📚 Processed Citations:', citations);

    const finalResult = {
      text: result.text || '',
      citations
    } as WebSearchResult;

    console.log('🎯 Final Result:', finalResult);
    return finalResult;
  },
}); 