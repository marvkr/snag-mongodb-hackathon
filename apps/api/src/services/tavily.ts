import { TavilyClient } from 'tavily';
import type { SearchResultsMetadata, TavilySearchResult } from '../db';

// Initialize Tavily client
let tavilyClient: TavilyClient | null = null;

function getTavilyClient(): TavilyClient | null {
  if (!process.env.TAVILY_API_KEY) {
    console.error('❌ TAVILY_API_KEY environment variable is not set');
    return null;
  }

  if (!tavilyClient) {
    tavilyClient = new TavilyClient({ apiKey: process.env.TAVILY_API_KEY });
  }

  return tavilyClient;
}

/**
 * Search Tavily for travel-related information
 * @param location - The travel location to search for
 * @returns Search results metadata or null if search fails
 */
export async function searchForTravel(
  location: string
): Promise<SearchResultsMetadata | null> {
  const client = getTavilyClient();
  if (!client) {
    return null;
  }

  const query = `${location} travel guide attractions activities`;

  try {
    console.log(`🔍 [Tavily] Searching for travel: "${query}"`);
    const startTime = Date.now();

    const response = await client.search(query, {
      maxResults: 5,
      searchDepth: 'basic',
    });

    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response || !response.results || response.results.length === 0) {
      console.log(`⚠️  [Tavily] No results found for: "${query}"`);
      return null;
    }

    // Transform Tavily response to our format
    const results: TavilySearchResult[] = response.results.map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      content: result.content || '',
      score: result.score || 0,
    }));

    const searchResults: SearchResultsMetadata = {
      query,
      results,
      searchedAt: new Date(),
      resultCount: results.length,
    };

    console.log(`✅ [Tavily] Found ${results.length} results in ${responseTime}s`);
    return searchResults;
  } catch (error) {
    console.error('❌ [Tavily] Search failed for travel:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query,
    });
    return null;
  }
}

/**
 * Search Tavily for product-related information
 * @param productName - The product name to search for
 * @param price - Optional product price
 * @returns Search results metadata or null if search fails
 */
export async function searchForProduct(
  productName: string,
  price?: string
): Promise<SearchResultsMetadata | null> {
  const client = getTavilyClient();
  if (!client) {
    return null;
  }

  const query = `${productName} reviews comparison alternatives`;

  try {
    console.log(`🔍 [Tavily] Searching for product: "${query}"`);
    const startTime = Date.now();

    const response = await client.search(query, {
      maxResults: 5,
      searchDepth: 'basic',
    });

    const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response || !response.results || response.results.length === 0) {
      console.log(`⚠️  [Tavily] No results found for: "${query}"`);
      return null;
    }

    // Transform Tavily response to our format
    const results: TavilySearchResult[] = response.results.map((result: any) => ({
      title: result.title || '',
      url: result.url || '',
      content: result.content || '',
      score: result.score || 0,
    }));

    const searchResults: SearchResultsMetadata = {
      query,
      results,
      searchedAt: new Date(),
      resultCount: results.length,
    };

    console.log(`✅ [Tavily] Found ${results.length} results in ${responseTime}s`);
    return searchResults;
  } catch (error) {
    console.error('❌ [Tavily] Search failed for product:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query,
    });
    return null;
  }
}
