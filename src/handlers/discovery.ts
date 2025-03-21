/**
 * Discovery Handler
 * 
 * This handler implements the MCP discovery endpoint, which allows clients
 * to discover available tools and capabilities.
 */

import { corsJsonResponse, corsErrorResponse } from '../utils/cors';
import { toolsRegistry } from '../tools';
import { Env } from '../index';
import '../types/overrides'; // Import our type overrides

/**
 * Handle discovery requests from MCP clients
 */
export async function handleDiscovery(request: Request, env: Env): Promise<Response> {
  // Only accept GET or POST requests
  if (request.method !== 'GET' && request.method !== 'POST') {
    return corsErrorResponse('Method not allowed', 405);
  }

  try {
    // Return the list of available tools and their schema
    const discoveryResponse = {
      server_info: {
        name: 'Apex MCP Server',
        version: '1.0.0',
        description: 'MCP Server for SEO API integration with DataForSEO'
      },
      protocol_version: '1.0',
      capabilities: {
        tools: Object.values(toolsRegistry).map(tool => ({
          name: tool.name,
          description: tool.description,
          schema: {
            type: 'object',
            properties: {
              ...tool.parameters.properties
            },
            required: tool.parameters.required || []
          }
        }))
      }
    };

    return corsJsonResponse(discoveryResponse);
  } catch (error) {
    console.error(`Error in discovery handler: ${error}`);
    return corsErrorResponse(`Failed to process discovery request: ${error}`, 500);
  }
} 