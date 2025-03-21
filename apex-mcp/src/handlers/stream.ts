/**
 * SSE Stream Handler
 * 
 * This handler sets up an SSE (Server-Sent Events) stream that allows
 * the MCP client to receive context data in real-time.
 */

import { corsErrorResponse } from '../utils/cors';
import { Env } from '../index';
import { MCPMessage } from '../types';

/**
 * Handle SSE stream requests
 */
export async function handleMCPStream(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // Only accept GET requests
  if (request.method !== 'GET') {
    return corsErrorResponse('Method not allowed', 405);
  }

  try {
    // Get client ID from headers or query parameters
    const clientId = request.headers.get('X-Client-ID') || 
                     new URL(request.url).searchParams.get('client_id') || 
                     'anonymous';

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Create a transformer to format messages according to SSE spec
    const encoder = new TextEncoder();
    
    const transformStream = new TransformStream({
      transform(message: MCPMessage, controller) {
        // Format as SSE event
        const event = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
        controller.enqueue(encoder.encode(event));
      }
    });

    // Create the SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connected message
        const initialMessage: MCPMessage = {
          type: 'connected',
          data: {
            clientId,
            timestamp: new Date().toISOString(),
            server: 'apex-mcp-server',
            protocol: 'mcp-v1'
          }
        };
        
        controller.enqueue(initialMessage);
        
        // Set up a heartbeat to keep the connection alive
        const heartbeatInterval = setInterval(() => {
          const heartbeat: MCPMessage = {
            type: 'heartbeat',
            data: {
              timestamp: new Date().toISOString()
            }
          };
          controller.enqueue(heartbeat);
        }, 30000); // Send heartbeat every 30 seconds
        
        // Store the interval so we can clear it on disconnect
        ctx.waitUntil(
          (async () => {
            // Wait for client to disconnect
            try {
              await request.signal.finished;
            } catch (error) {
              // Request was aborted
            } finally {
              clearInterval(heartbeatInterval);
              console.log(`Client ${clientId} disconnected`);
            }
          })()
        );

        // Register client in KV if not anonymous
        if (clientId !== 'anonymous') {
          ctx.waitUntil(
            env.CONTEXT_DATA.put(
              `client:${clientId}:last_seen`, 
              new Date().toISOString(),
              { expirationTtl: 86400 } // 1 day TTL
            )
          );
        }

        // Set up a polling mechanism to check for new context for this client
        const pollInterval = setInterval(async () => {
          try {
            // Check for new context in KV
            const clientContextListKey = `client:${clientId}:contexts`;
            const processedContextsKey = `client:${clientId}:processed_contexts`;
            
            // Get the list of available contexts for this client
            const availableContextsStr = await env.CONTEXT_DATA.get(clientContextListKey);
            if (availableContextsStr) {
              const availableContexts = JSON.parse(availableContextsStr) as string[];
              
              // Get the list of already processed contexts
              const processedContextsStr = await env.CONTEXT_DATA.get(processedContextsKey);
              const processedContexts = processedContextsStr ? 
                JSON.parse(processedContextsStr) as string[] : [];
              
              // Find contexts that haven't been processed yet
              const newContextIds = availableContexts.filter(id => !processedContexts.includes(id));
              
              // If there are new contexts, fetch and send them
              for (const contextId of newContextIds) {
                const contextStr = await env.CONTEXT_DATA.get(`context:${contextId}`);
                if (contextStr) {
                  const context = JSON.parse(contextStr);
                  
                  // Send the context through the stream
                  controller.enqueue({
                    type: 'context',
                    data: context
                  });
                  
                  // Mark this context as processed
                  processedContexts.push(contextId);
                }
              }
              
              // Update the processed contexts list
              if (newContextIds.length > 0) {
                await env.CONTEXT_DATA.put(
                  processedContextsKey,
                  JSON.stringify(processedContexts),
                  { expirationTtl: 86400 }
                );
              }
            }
          } catch (error) {
            console.error(`Error polling for context for client ${clientId}: ${error}`);
          }
        }, 5000); // Poll every 5 seconds
        
        // Clean up polling on disconnect
        ctx.waitUntil(
          (async () => {
            try {
              await request.signal.finished;
            } catch (error) {
              // Request was aborted
            } finally {
              clearInterval(pollInterval);
            }
          })()
        );
      },
      
      pull(controller) {
        // This is called when the consumer is ready for more data
        // We're already pushing data with heartbeats and context polling
      },
      
      cancel() {
        console.log(`Stream for client ${clientId} was cancelled`);
      }
    });

    // Pipe through the transformer to format as SSE
    const sseStream = stream.pipeThrough(transformStream);
    return new Response(sseStream, { headers });
  } catch (error) {
    console.error(`Error in SSE stream handler: ${error}`);
    return corsErrorResponse(`Failed to establish SSE stream: ${error}`, 500);
  }
} 