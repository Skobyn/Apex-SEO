/**
 * Health Check Handler
 * 
 * This handler provides health status for the MCP server.
 */

import { corsJsonResponse, corsErrorResponse } from '../utils/cors';
import { Env } from '../index';

/**
 * Check if KV is accessible
 */
async function checkKVHealth(env: Env): Promise<boolean> {
  try {
    const healthKey = 'health:check';
    const healthValue = `Health check at ${new Date().toISOString()}`;
    
    // Write to KV
    await env.CONTEXT_DATA.put(healthKey, healthValue, { expirationTtl: 60 });
    
    // Read from KV
    const readValue = await env.CONTEXT_DATA.get(healthKey);
    
    return readValue === healthValue;
  } catch (error) {
    console.error(`KV health check failed: ${error}`);
    return false;
  }
}

/**
 * Handle health check requests
 */
export async function handleHealthCheck(env: Env): Promise<Response> {
  try {
    // Check KV health
    const kvHealthy = await checkKVHealth(env);
    
    // Check DataForSEO API key is configured
    const apiKeyConfigured = !!env.DATAFORSEO_API_KEY && 
                            env.DATAFORSEO_API_KEY !== 'YOUR_DATAFORSEO_API_KEY';
    
    // Overall health status
    const healthy = kvHealthy && apiKeyConfigured;
    
    const statusCode = healthy ? 200 : 503;
    
    return corsJsonResponse({
      status: healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        kv_storage: {
          status: kvHealthy ? 'passed' : 'failed'
        },
        api_key: {
          status: apiKeyConfigured ? 'configured' : 'not_configured'
        }
      },
      version: '1.0.0'
    }, statusCode);
  } catch (error) {
    console.error(`Health check failed: ${error}`);
    return corsErrorResponse(`Health check failed: ${error}`, 500);
  }
} 