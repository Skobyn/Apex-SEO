/**
 * Tool Call Handler
 * 
 * This handler processes calls to individual tools from the MCP client.
 */

import { corsJsonResponse, corsErrorResponse } from '../utils/cors';
import { validateToolArguments, getAllTools, executeToolCall } from '../tools';
import { Env } from '../index';
import { ToolCallRequest, ToolResponse, KeywordResearchRequest, ContentAnalysisRequest, OnPageRequest } from '../types';
import * as DataForSEO from '../services/dataforseo';
import { Request, ExecutionContext } from '@cloudflare/workers-types';
import '../types/overrides'; // Import our type overrides

/**
 * Handle tool call requests
 */
export async function handleToolCall(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json() as ToolCallRequest;
    
    // Validate request
    if (!data.name || !data.parameters) {
      return new Response(JSON.stringify({ 
        error: "Invalid request. 'name' and 'parameters' are required."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Get client ID
    const clientId = request.headers.get("X-Client-ID") || 'anonymous';
    
    // Execute the tool call
    const result = await executeToolCall(data.name, data.parameters, {
      env,
      ctx,
      clientId
    });
    
    return new Response(JSON.stringify(result), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error in tool call:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to execute tool call", 
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

/**
 * Handle tool discovery requests
 */
export async function handleToolDiscovery(request: Request, env: Env): Promise<Response> {
  // Get available tools
  const tools = getAllTools();

  return new Response(JSON.stringify({ tools }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Execute the requested tool based on its name and arguments
 */
async function executeTool(
  toolName: string,
  args: Record<string, any>,
  env: Env,
  ctx: ExecutionContext
): Promise<ToolResponse> {
  try {
    switch (toolName) {
      // SERP Analysis Tools
      case 'keyword_rankings': {
        const { domain, keywords, location_code, language_code } = args;
        const data = await DataForSEO.checkKeywordRankings(
          domain,
          keywords,
          location_code,
          language_code,
          env
        );
        return {
          result: data,
          metadata: {
            tool: toolName,
            timestamp: new Date().toISOString(),
            args: { domain, keywords_count: keywords.length }
          }
        };
      }

      // Keyword Data Tools
      case 'keywords_data': {
        const data = await DataForSEO.getKeywordsDataAdvanced(args, env);
        return {
          result: data,
          metadata: {
            tool: toolName,
            timestamp: new Date().toISOString(),
            args: { keywords_count: args.keywords.length }
          }
        };
      }

      case 'keyword_ideas': {
        const data = await DataForSEO.getKeywordIdeas(args as KeywordResearchRequest, env);
        return {
          result: data,
          metadata: {
            tool: toolName,
            timestamp: new Date().toISOString(),
            args: { keyword: args.keyword }
          }
        };
      }

      // Content Analysis Tools
      case 'analyze_content': {
        const data = await DataForSEO.analyzeContent(args as ContentAnalysisRequest, env);
        return {
          result: data,
          metadata: {
            tool: toolName,
            timestamp: new Date().toISOString(),
            args: { url: args.url }
          }
        };
      }

      // Backlinks Tools
      case 'backlinks_summary': {
        const data = await DataForSEO.getBacklinksAdvanced(args, env);
        return {
          result: data,
          metadata: {
            tool: toolName,
            timestamp: new Date().toISOString(),
            args: { target: args.target }
          }
        };
      }

      // On-Page Tools
      case 'analyze_onpage': {
        const data = await DataForSEO.analyzeOnPage(args as OnPageRequest, env);
        return {
          result: data,
          metadata: {
            tool: toolName,
            timestamp: new Date().toISOString(),
            args: { target: args.target }
          }
        };
      }

      // Rank Tracking Tools
      case 'track_keywords': {
        const { domain, keywords } = args;
        const data = await DataForSEO.trackKeywordRankings(domain, keywords, env);
        return {
          result: data,
          metadata: {
            tool: toolName,
            timestamp: new Date().toISOString(),
            args: { domain, keywords_count: keywords.length }
          }
        };
      }

      // Competitor Research Tools
      case 'find_competitors': {
        const { domain } = args;
        const data = await DataForSEO.findCompetitors(domain, env);
        return {
          result: data,
          metadata: {
            tool: toolName,
            timestamp: new Date().toISOString(),
            args: { domain }
          }
        };
      }

      // Domain Analysis Tools
      case 'domain_metrics': {
        const { domain } = args;
        const data = await DataForSEO.getDomainMetrics(domain, env);
        return {
          result: data,
          metadata: {
            tool: toolName,
            timestamp: new Date().toISOString(),
            args: { domain }
          }
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}: ${error}`);
    return {
      result: null,
      error: `Failed to execute tool ${toolName}: ${error}`
    };
  }
} 