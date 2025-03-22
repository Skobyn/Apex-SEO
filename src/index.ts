/**
 * Apex MCP Server - Main Entry Point
 * 
 * This file serves as the entry point for the MCP Server running on Cloudflare Workers.
 * It handles routing, CORS, and dispatches requests to the appropriate handlers.
 */

import { KVNamespace } from '@cloudflare/workers-types';
import { ToolDefinition } from './types';

export interface Env {
  MCP_STORAGE: KVNamespace;
  CONTEXT_DATA: KVNamespace;
  DATAFORSEO_USERNAME: string;
  DATAFORSEO_API_KEY: string;
}

// Explicitly define all available tools
function getAllTools(): ToolDefinition[] {
  return [
    // SERP Analysis Tools
    {
      name: 'keyword_rankings',
      description: 'Check keyword rankings for a domain in search results',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'The domain to check rankings for'
          },
          keywords: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of keywords to check'
          },
          location_code: {
            type: 'number',
            description: 'Location code (default: 2840 for US)'
          },
          language_code: {
            type: 'string',
            description: 'Language code (default: en)'
          }
        },
        required: ['domain', 'keywords']
      }
    },
    
    // Keyword Data Tools
    {
      name: 'keywords_data',
      description: 'Get search volume and metrics for a list of keywords',
      parameters: {
        type: 'object',
        properties: {
          keywords: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of keywords to get data for'
          },
          location_code: {
            type: 'number',
            description: 'Location code (default: 2840 for US)'
          },
          language_code: {
            type: 'string',
            description: 'Language code (default: en)'
          }
        },
        required: ['keywords']
      }
    },
    
    {
      name: 'keyword_ideas',
      description: 'Get related keyword ideas and suggestions for a seed keyword',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description: 'Seed keyword to get ideas for'
          },
          location_code: {
            type: 'number',
            description: 'Location code (default: 2840 for US)'
          },
          language_code: {
            type: 'string',
            description: 'Language code (default: en)'
          }
        },
        required: ['keyword']
      }
    },
    
    // Content Analysis Tools
    {
      name: 'analyze_content',
      description: 'Analyze content for SEO optimization',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL of the content to analyze'
          },
          keyword: {
            type: 'string',
            description: 'Target keyword for the content'
          }
        },
        required: ['url']
      }
    },
    
    // Backlinks Tools
    {
      name: 'backlinks_summary',
      description: 'Get backlink summary data for a domain or URL',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Domain or URL to analyze'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 100)'
          }
        },
        required: ['target']
      }
    },
    
    // On-Page Tools
    {
      name: 'analyze_onpage',
      description: 'Analyze on-page SEO factors for a domain',
      parameters: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Domain or URL to analyze'
          },
          max_crawl_pages: {
            type: 'number',
            description: 'Maximum number of pages to crawl (default: 10)'
          }
        },
        required: ['target']
      }
    },
    
    // Rank Tracking Tools
    {
      name: 'track_keywords',
      description: 'Track keyword position history for a domain',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Domain to track keywords for'
          },
          keywords: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'List of keywords to track'
          }
        },
        required: ['domain', 'keywords']
      }
    },
    
    // Competitor Research Tools
    {
      name: 'find_competitors',
      description: 'Find competitors for a domain',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Domain to find competitors for'
          }
        },
        required: ['domain']
      }
    },
    
    // Domain Analysis Tools
    {
      name: 'domain_metrics',
      description: 'Get SEO metrics for a domain',
      parameters: {
        type: 'object',
        properties: {
          domain: {
            type: 'string',
            description: 'Domain to get metrics for'
          }
        },
        required: ['domain']
      }
    }
  ];
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
        // Get all the tools from our explicit list
        const tools = getAllTools().map((tool: ToolDefinition) => ({
          name: tool.name,
          description: tool.description,
          parameters: {
            type: tool.parameters.type,
            properties: tool.parameters.properties,
            required: tool.parameters.required || []
          }
        }));
        
        console.log('Exposing tools:', tools.map((t: any) => t.name).join(', '));
        console.log('Tools count:', tools.length);
        
        return new Response(JSON.stringify({ tools }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      
      // Tool execution endpoint
      if (path === "/v1/tools/execute" && request.method === "POST") {
        return handleToolExecution(request, env, ctx);
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

// Handle tool execution
async function handleToolExecution(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const data = await request.json() as any;
    
    // Validate required fields
    if (!data.clientId || !data.name) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: clientId and name are required" 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    
    const { clientId, name, parameters } = data;
    
    // Get the explicit list of tools
    const allTools = getAllTools();
    const toolDef = allTools.find((tool: ToolDefinition) => tool.name === name);
    
    // Check if the tool exists
    if (!toolDef) {
      return new Response(JSON.stringify({ 
        error: `Tool "${name}" not found` 
      }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    
    // Execute the tool
    const toolContext = { clientId, env, ctx };
    
    // Import the tool execution function dynamically
    const { executeToolCall } = await import('./tools');
    const result = await executeToolCall(name, parameters || {}, toolContext);
    
    return new Response(JSON.stringify({
      success: true,
      result,
      metadata: {
        tool: name,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
} 