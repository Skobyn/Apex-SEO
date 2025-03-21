/**
 * Apex MCP Server - Main Entry Point
 * 
 * This file serves as the entry point for the MCP Server running on Cloudflare Workers.
 * It handles routing, CORS, and dispatches requests to the appropriate handlers.
 */

import { handleCORS } from './utils/cors';
import { handleMCPStream } from './handlers/stream';
import { handleContextSubmission } from './handlers/context';
import { handleDiscovery } from './handlers/discovery';
import { handleToolCall } from './handlers/tools';
import { handleHealthCheck } from './handlers/health';

export interface Env {
  // KV namespace for storing context data
  CONTEXT_DATA: KVNamespace;
  // Environment variables for API keys
  DATAFORSEO_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return handleCORS();
    }

    // Parse URL to determine the endpoint
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Handle different request paths
      if (path.startsWith('/v1/stream')) {
        return handleMCPStream(request, env, ctx);
      }
      
      if (path.startsWith('/v1/context')) {
        return handleContextSubmission(request, env, ctx);
      }

      if (path.startsWith('/v1/discover')) {
        return handleDiscovery(request, env);
      }

      if (path.startsWith('/v1/tools/call')) {
        return handleToolCall(request, env, ctx);
      }

      if (path === '/health') {
        return handleHealthCheck(env);
      }
      
      // Default response for root path - documentation or status
      if (path === '/' || path === '') {
        return new Response(`
          Apex MCP Server - SEO API Integration
          
          Available endpoints:
          - /v1/stream - SSE stream for receiving context
          - /v1/context - Submit new context data
          - /v1/discover - Discover available tools and capabilities
          - /v1/tools/call - Call a specific tool
          - /health - Server health check
        `, {
          headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      // Handle 404 Not Found
      return new Response('Not Found', { 
        status: 404,
        headers: {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
        }
      });
    } catch (error) {
      // Handle any uncaught errors
      console.error(`Uncaught error: ${error}`);
      return new Response(`Internal Server Error: ${error}`, { 
        status: 500,
        headers: {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
        }
      });
    }
  },
}; 