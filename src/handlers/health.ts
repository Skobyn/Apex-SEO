/**
 * Health Check Handler
 * 
 * This handler provides health status for the MCP server.
 */

import { Request } from '@cloudflare/workers-types';
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
export async function handleHealthCheck(request: Request, env: Env): Promise<Response> {
  // Check if we can access the KV namespace
  let kvStatus = "ok";
  try {
    await env.MCP_STORAGE.get("health-check");
  } catch (error) {
    kvStatus = "error";
  }

  // Construct response
  const healthData = {
    status: "ok",
    version: "1.0.0",
    services: {
      kv: kvStatus,
    },
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(healthData), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
} 