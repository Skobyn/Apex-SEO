/**
 * DataForSEO API Service
 * 
 * This service provides methods for interacting with various DataForSEO APIs
 * for SEO data collection and analysis.
 */

import { Env } from '../index';
import { 
  DataForSEOBaseResponse, 
  SERPKeywordData,
  KeywordsDataRequest,
  KeywordResearchRequest,
  ContentAnalysisRequest,
  BacklinksRequest,
  OnPageRequest
} from '../types';

// Base API configuration
const BASE_URL = 'https://api.dataforseo.com/v3';

/**
 * Create authorization header for DataForSEO API
 */
function createAuthHeader(apiKey: string): string {
  return `Basic ${apiKey}`;
}

/**
 * Make a request to DataForSEO API
 */
async function makeRequest(
  endpoint: string, 
  data: any, 
  apiKey: string
): Promise<DataForSEOBaseResponse> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': createAuthHeader(apiKey),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`DataForSEO API returned ${response.status}: ${response.statusText}`);
    }

    return await response.json() as DataForSEOBaseResponse;
  } catch (error) {
    console.error(`Error calling DataForSEO API: ${error}`);
    throw error;
  }
}

/**
 * SERP API - Check keyword rankings in search results
 */
export async function checkKeywordRankings(
  domain: string, 
  keywords: string[], 
  locationCode: number = 2840, // US by default
  languageCode: string = 'en',
  env: Env
): Promise<DataForSEOBaseResponse> {
  const endpoint = '/serp/google/organic/live/advanced';
  
  const tasks = keywords.map(keyword => ({
    keyword,
    target: domain,
    location_code: locationCode,
    language_code: languageCode,
    device: 'desktop'
  } as SERPKeywordData));
  
  return makeRequest(
    endpoint, 
    { tasks }, 
    env.DATAFORSEO_API_KEY
  );
}

/**
 * Keywords Data API - Get search volume and metrics for keywords
 */
export async function getKeywordsData(
  request: KeywordsDataRequest,
  env: Env
): Promise<DataForSEOBaseResponse> {
  const endpoint = '/keywords_data/google/search_volume/live';
  
  const tasks = [{
    keywords: request.keywords,
    location_code: request.location_code || 2840,
    language_code: request.language_code || 'en'
  }];
  
  return makeRequest(
    endpoint, 
    { tasks }, 
    env.DATAFORSEO_API_KEY
  );
}

/**
 * Keyword Research API - Get related keywords and suggestions
 */
export async function getKeywordIdeas(
  request: KeywordResearchRequest,
  env: Env
): Promise<DataForSEOBaseResponse> {
  const endpoint = '/keywords_data/google/keywords_for_keywords/live';
  
  const tasks = [{
    keyword: request.keyword,
    location_code: request.location_code || 2840,
    language_code: request.language_code || 'en'
  }];
  
  return makeRequest(
    endpoint, 
    { tasks }, 
    env.DATAFORSEO_API_KEY
  );
}

/**
 * Content Analysis API - Analyze content for SEO optimization
 */
export async function analyzeContent(
  request: ContentAnalysisRequest,
  env: Env
): Promise<DataForSEOBaseResponse> {
  const endpoint = '/content_analysis/content/summary/live';
  
  const tasks = [{
    url: request.url,
    keyword: request.keyword
  }];
  
  return makeRequest(
    endpoint, 
    { tasks }, 
    env.DATAFORSEO_API_KEY
  );
}

/**
 * Backlinks API - Get backlink data for a domain
 */
export async function getBacklinks(
  request: BacklinksRequest,
  env: Env
): Promise<DataForSEOBaseResponse> {
  const endpoint = '/backlinks/summary/live';
  
  const tasks = [{
    target: request.target,
    limit: request.limit || 100
  }];
  
  return makeRequest(
    endpoint, 
    { tasks }, 
    env.DATAFORSEO_API_KEY
  );
}

/**
 * On-Page API - Analyze on-page SEO factors
 */
export async function analyzeOnPage(
  request: OnPageRequest,
  env: Env
): Promise<DataForSEOBaseResponse> {
  const endpoint = '/on_page/task_post';
  
  const tasks = [{
    target: request.target,
    max_crawl_pages: request.max_crawl_pages || 10
  }];
  
  return makeRequest(
    endpoint, 
    { tasks }, 
    env.DATAFORSEO_API_KEY
  );
}

/**
 * Rank Tracker API - Track keyword position history
 */
export async function trackKeywordRankings(
  domain: string,
  keywords: string[],
  env: Env
): Promise<DataForSEOBaseResponse> {
  const endpoint = '/rank_tracker/tasks_ready';
  
  // First create tracking tasks
  const createTasksEndpoint = '/rank_tracker/add';
  const tasks = keywords.map(keyword => ({
    target: domain,
    keywords: [keyword],
    location_code: 2840,
    language_code: 'en'
  }));
  
  // Create the tracking tasks
  await makeRequest(
    createTasksEndpoint, 
    { tasks }, 
    env.DATAFORSEO_API_KEY
  );
  
  // Then check for ready results
  return makeRequest(
    endpoint, 
    {}, 
    env.DATAFORSEO_API_KEY
  );
}

/**
 * Competitor Research API - Find competitors for a domain
 */
export async function findCompetitors(
  domain: string,
  env: Env
): Promise<DataForSEOBaseResponse> {
  const endpoint = '/domain_analytics/competitors/live';
  
  const tasks = [{
    target: domain,
    limit: 10
  }];
  
  return makeRequest(
    endpoint, 
    { tasks }, 
    env.DATAFORSEO_API_KEY
  );
}

/**
 * Domain Analytics API - Get domain SEO metrics
 */
export async function getDomainMetrics(
  domain: string,
  env: Env
): Promise<DataForSEOBaseResponse> {
  const endpoint = '/domain_analytics/domain_intersection/live';
  
  const tasks = [{
    targets: [domain],
    limit: 10
  }];
  
  return makeRequest(
    endpoint, 
    { tasks }, 
    env.DATAFORSEO_API_KEY
  );
} 