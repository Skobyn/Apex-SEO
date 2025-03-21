/**
 * Apex MCP Server - Main Entry Point
 * 
 * This file serves as the entry point for the MCP Server running on Cloudflare Workers.
 * It handles routing, CORS, and dispatches requests to the appropriate handlers.
 */

import { KVNamespace } from '@cloudflare/workers-types';

export interface Env {
  MCP_STORAGE: KVNamespace;
  CONTEXT_DATA: KVNamespace;
  DATAFORSEO_USERNAME: string;
  DATAFORSEO_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Client-ID",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Health check
      if (path === "/health") {
        return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // SSE Stream endpoint
      if (path === "/v1/stream") {
        const clientId = request.headers.get("X-Client-ID") || url.searchParams.get("client_id") || "anonymous";
        return handleStream(clientId, env, ctx);
      }

      // Context submission
      if (path === "/v1/context" && request.method === "POST") {
        return handleContext(request, env);
      }

      // Tool discovery
      if (path === "/v1/tools") {
        return new Response(JSON.stringify({ 
          tools: [
            {
              name: "dataforseo_serp",
              description: "Search for results in search engines",
              parameters: {
                type: "object",
                properties: {
                  keyword: { type: "string", description: "Search query" },
                  location_code: { type: "number", description: "Location code (default: 2840 for US)" }
                },
                required: ["keyword"]
              }
            }
          ] 
        }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // Default response
      return new Response("Not Found", { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
    } catch (error) {
      return new Response(`Error: ${error instanceof Error ? error.message : String(error)}`, { 
        status: 500, 
        headers: { "Access-Control-Allow-Origin": "*" } 
      });
    }
  }
};

// Handle SSE Stream
function handleStream(clientId: string, env: Env, ctx: ExecutionContext): Response {
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const encoder = new TextEncoder();
  
  const transformStream = new TransformStream({
    transform(message: any, controller) {
      const event = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
      controller.enqueue(encoder.encode(event));
    }
  });

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected message
      const initialMessage = {
        type: "connected",
        data: {
          clientId,
          timestamp: new Date().toISOString(),
          server: "apex-mcp-server",
          protocol: "mcp-v1"
        }
      };
      
      controller.enqueue(initialMessage);
      
      // Set up a heartbeat to keep the connection alive
      const heartbeatInterval = setInterval(() => {
        const heartbeat = {
          type: "heartbeat",
          data: {
            timestamp: new Date().toISOString()
          }
        };
        controller.enqueue(heartbeat);
      }, 30000); // Send heartbeat every 30 seconds
      
      ctx.waitUntil(
        (async () => {
          // Wait for disconnect
          await new Promise((resolve) => {
            setTimeout(resolve, 3600000); // Max 1 hour connection
          });
          clearInterval(heartbeatInterval);
        })()
      );
    },
    cancel() {
      console.log(`Stream for client cancelled`);
    }
  });

  const sseStream = stream.pipeThrough(transformStream);
  return new Response(sseStream, { headers });
}

// Handle context submission
async function handleContext(request: Request, env: Env): Promise<Response> {
  try {
    const data = await request.json() as any;
    
    // Validate required fields
    if (!data.clientId || !data.content) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: clientId and content are required" 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    
    // Generate a reference ID for this context data
    const contextId = crypto.randomUUID();
    
    // Structure the context data
    const contextData = {
      id: contextId,
      clientId: data.clientId,
      content: data.content,
      metadata: data.metadata || {},
      timestamp: new Date().toISOString()
    };
    
    // Store in KV
    await env.MCP_STORAGE.put(
      `context:${contextId}`, 
      JSON.stringify(contextData),
      { expirationTtl: 86400 }
    );
    
    return new Response(JSON.stringify({ 
      success: true, 
      contextId,
      message: "Context data stored successfully" 
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: "Failed to process context data", 
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
} 