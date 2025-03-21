/**
 * Context Submission Handler
 * 
 * This handler processes context data submitted by external sources
 * and stores it for retrieval via the SSE stream.
 */

import { corsJsonResponse, corsErrorResponse } from '../utils/cors';
import { Env } from '../index';
import { ContextData } from '../types';

/**
 * Handle context submission requests
 */
export async function handleContextSubmission(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return corsErrorResponse('Method not allowed', 405);
  }

  try {
    // Parse the request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.clientId || !data.content) {
      return corsErrorResponse('Missing required fields: clientId and content are required', 400);
    }
    
    // Generate a unique ID for this context
    const contextId = crypto.randomUUID();
    
    // Structure the context data
    const contextData: ContextData = {
      id: contextId,
      clientId: data.clientId,
      content: data.content,
      metadata: data.metadata || {},
      timestamp: new Date().toISOString(),
      expiresAt: data.expiresAt || new Date(Date.now() + 86400000).toISOString() // 24h expiry
    };
    
    // Store in KV
    await env.CONTEXT_DATA.put(
      `context:${contextId}`, 
      JSON.stringify(contextData),
      { expirationTtl: 86400 } // 24h TTL
    );
    
    // Add to client's context list
    const clientContextListKey = `client:${data.clientId}:contexts`;
    const existingListStr = await env.CONTEXT_DATA.get(clientContextListKey);
    const contextList = existingListStr ? JSON.parse(existingListStr) as string[] : [];
    
    // Add the new context to the list
    contextList.push(contextId);
    
    // Keep only the most recent 100 contexts per client
    if (contextList.length > 100) {
      // Remove the oldest contexts
      const removedContexts = contextList.splice(0, contextList.length - 100);
      
      // Delete the removed contexts from KV
      ctx.waitUntil(
        Promise.all(
          removedContexts.map(id => 
            env.CONTEXT_DATA.delete(`context:${id}`)
          )
        )
      );
    }
    
    // Update the client's context list
    await env.CONTEXT_DATA.put(
      clientContextListKey, 
      JSON.stringify(contextList),
      { expirationTtl: 86400 } // 24h TTL
    );
    
    return corsJsonResponse({
      success: true,
      contextId,
      message: 'Context data stored successfully'
    });
  } catch (error) {
    console.error(`Error in context submission: ${error}`);
    return corsErrorResponse(`Failed to process context data: ${error}`, 500);
  }
} 