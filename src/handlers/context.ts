/**
 * Context Submission Handler
 * 
 * This handler processes context data submitted by external sources
 * and stores it for retrieval via the SSE stream.
 */

import { Request } from '@cloudflare/workers-types';
import { Env } from '../index';

interface ContextData {
  clientId: string;
  content: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
}

/**
 * Handle context submission requests
 */
export async function handleContext(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json() as ContextData;
    
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
      timestamp: new Date().toISOString(),
      expiresAt: data.expiresAt || new Date(Date.now() + 86400000).toISOString() // Default 24h expiry
    };
    
    // Store in KV with expiration
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
    console.error("Error processing context submission:", error);
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