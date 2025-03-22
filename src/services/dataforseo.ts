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
function createAuthHeader(username: string, apiKey: string): string {
  // DataForSEO expects "username:apiKey" encoded in Base64
  const credentials = `${username}:${apiKey}`;
  
  // Hard-code the exact value from the working curl example for debugging
  // This should match what btoa(credentials) generates if credentials are correct
  const knownWorkingHeader = 'Basic c2JlbnNvbkBhaWV4ZWN1dGl2ZWxlYWRlci5jb206Nzc4ZjdlNjJiM2NkZWQ0NA==';
  
  // Log the expected vs. generated values for comparison
  const encodedCredentials = btoa(credentials);
  const generatedHeader = `Basic ${encodedCredentials}`;
  
  console.log('Auth debugging:');
  console.log('- Credentials string:', credentials);
  console.log('- Encoded credentials:', encodedCredentials);
  console.log('- Generated header:', generatedHeader);
  console.log('- Known working header:', knownWorkingHeader);
  console.log('- Match?', generatedHeader === knownWorkingHeader);
  
  // Use the generated header (should match the known working one if credentials are correct)
  return generatedHeader;
}

/**
 * Make a request to DataForSEO API
 */
async function makeRequest(
  endpoint: string, 
  data: any, 
  env: Env
): Promise<DataForSEOBaseResponse> {
  try {
    console.log(`Making request to DataForSEO API: ${endpoint}`);
    console.log(`Request data: ${JSON.stringify(data)}`);

    // Check credentials
    const username = env.DATAFORSEO_USERNAME;
    const apiKey = env.DATAFORSEO_API_KEY;
    
    if (!username || !apiKey) {
      console.error('Missing DataForSEO credentials');
      throw new Error('DataForSEO username and API key are required');
    }

    console.log(`Using DataForSEO credentials - Username: ${username}, API Key: ${apiKey}`);
    
    // Get the authorization header
    const authHeader = createAuthHeader(username, apiKey);

    console.log('Request details:');
    console.log('- URL:', `${BASE_URL}${endpoint}`);
    console.log('- Method: POST');
    console.log('- Headers:');
    console.log('  - Authorization:', authHeader.substring(0, 20) + '...');
    console.log('  - Content-Type: application/json');
    console.log('- Body:', JSON.stringify(data));

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    // Log response status
    console.log(`DataForSEO API response status: ${response.status} ${response.statusText}`);

    // Check for error responses
    if (!response.ok) {
      // Try to get both text and JSON formats of the error
      let errorText = '';
      let errorJson = null;
      
      try {
        errorText = await response.text();
        try {
          errorJson = JSON.parse(errorText);
          console.error('DataForSEO API error (JSON):', JSON.stringify(errorJson, null, 2));
        } catch (e) {
          console.error('DataForSEO API error (Text):', errorText);
        }
      } catch (e) {
        console.error('Failed to read error response:', e);
      }
      
      throw new Error(`DataForSEO API returned ${response.status}: ${response.statusText}. Details: ${errorText}`);
    }

    // Parse and log response
    const responseData = await response.json() as DataForSEOBaseResponse;
    console.log(`DataForSEO API response received:`, JSON.stringify(responseData, null, 2));
    
    // Check for API-level errors
    if (responseData.status_code !== 20000) {
      console.error(`DataForSEO API business error: ${responseData.status_message}`);
      throw new Error(`DataForSEO API error: ${responseData.status_message}`);
    }

    return responseData;
  } catch (error) {
    console.error(`Error calling DataForSEO API: ${error instanceof Error ? error.message : String(error)}`);
    
    // Return a properly formatted error response
    return {
      status_code: 50000,
      status_message: error instanceof Error ? error.message : String(error),
      time: new Date().toISOString(),
      cost: 0,
      tasks_count: 0,
      tasks_error: 1,
      tasks: []
    };
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
    env
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
    env
  );
}

/**
 * Keyword Research API - Get related keywords and suggestions
 */
export async function getKeywordIdeas(
  request: KeywordResearchRequest,
  env: Env
): Promise<DataForSEOBaseResponse> {
  try {
    console.log('getKeywordIdeas called with:', JSON.stringify(request));
    
    if (!request || !request.keyword) {
      throw new Error('Keyword is required for keyword ideas search');
    }
    
    const endpoint = '/keywords_data/google/keywords_for_keywords/live';
    
    const tasks = [{
      keyword: request.keyword,
      location_code: request.location_code || 2840,
      language_code: request.language_code || 'en'
    }];
    
    console.log('Sending request to DataForSEO with tasks:', JSON.stringify(tasks));
    
    return makeRequest(
      endpoint, 
      { tasks }, 
      env
    );
  } catch (error) {
    console.error(`Error in getKeywordIdeas: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
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
    env
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
    env
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
    env
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
    env
  );
  
  // Then check for ready results
  return makeRequest(
    endpoint, 
    {}, 
    env
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
    env
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
    env
  );
}

interface DataForSEOResponse {
  status_code: number;
  status_message?: string;
  tasks?: Array<{
    result?: any[];
  }>;
}

export async function getSerpResults(parameters: any, env: Env): Promise<any> {
  const { keyword, location_code = 2840, language_code = "en", device = "desktop" } = parameters;
  
  const endpoint = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced";
  
  const requestData = [{
    keyword,
    location_code,
    language_code,
    device,
    os: "windows"
  }];
  
  try {
    const response = await makeDataForSEORequest(endpoint, requestData, env);
    
    return {
      success: true,
      results: response.tasks?.[0]?.result || [],
      metadata: {
        keyword,
        location_code,
        language_code,
        device
      }
    };
  } catch (error) {
    console.error("Error in SERP API call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function getKeywordsDataAdvanced(parameters: any, env: Env): Promise<any> {
  const { keywords, location_code = 2840, language_code = "en" } = parameters;
  
  const endpoint = "https://api.dataforseo.com/v3/keywords_data/google/search_volume/live";
  
  const requestData = [{
    keywords,
    location_code,
    language_code
  }];
  
  try {
    const response = await makeDataForSEORequest(endpoint, requestData, env);
    
    return {
      success: true,
      results: response.tasks?.[0]?.result || [],
      metadata: {
        keywords,
        location_code,
        language_code
      }
    };
  } catch (error) {
    console.error("Error in Keywords Data API call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function getBacklinksAdvanced(parameters: any, env: Env): Promise<any> {
  const { target, limit = 100 } = parameters;
  
  const endpoint = "https://api.dataforseo.com/v3/backlinks/summary/live";
  
  const requestData = [{
    target,
    limit
  }];
  
  try {
    const response = await makeDataForSEORequest(endpoint, requestData, env);
    
    return {
      success: true,
      results: response.tasks?.[0]?.result || [],
      metadata: {
        target,
        limit
      }
    };
  } catch (error) {
    console.error("Error in Backlinks API call:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Make this function available for export
export async function makeDataForSEORequest(endpoint: string, data: any[], env: Env): Promise<DataForSEOResponse> {
  const username = env.DATAFORSEO_USERNAME;
  const apiKey = env.DATAFORSEO_API_KEY;
  
  if (!username || !apiKey) {
    throw new Error("DataForSEO credentials not configured");
  }
  
  // Get auth header using the same function as makeRequest
  const authHeader = createAuthHeader(username, apiKey);
  
  // Log request details
  console.log(`makeDataForSEORequest to ${endpoint}`);
  console.log(`Request data: ${JSON.stringify(data)}`);
  console.log(`Using auth header: ${authHeader.substring(0, 20)}...`);
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader
    },
    body: JSON.stringify(data)
  });
  
  // Log response status
  console.log(`Response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`DataForSEO API error: ${errorText}`);
    throw new Error(`DataForSEO API error: HTTP ${response.status} - ${errorText}`);
  }
  
  const result = await response.json() as DataForSEOResponse;
  console.log(`Response received: ${JSON.stringify(result, null, 2)}`);
  
  if (!result.status_code || result.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${result.status_message || "Unknown error"}`);
  }
  
  return result;
} 