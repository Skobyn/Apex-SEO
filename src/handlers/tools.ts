/**
 * Tool Call Handler
 * 
 * This handler processes calls to individual tools from the MCP client.
 */

import { corsJsonResponse, corsErrorResponse } from '../utils/cors';
import { validateToolArguments } from '../tools';
import { Env } from '../index';
import { ToolCallRequest, ToolResponse } from '../types';
import * as DataForSEO from '../services/dataforseo';

/**
 * Handle tool call requests
 */
export async function handleToolCall(
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
    const body = await request.json() as ToolCallRequest;

    // Validate request format
    if (!body.params || !body.params.name || !body.params.arguments) {
      return corsErrorResponse('Invalid request format. Missing required fields: params.name, params.arguments', 400);
    }

    const { name, arguments: args } = body.params;

    // Validate tool arguments
    const validation = validateToolArguments(name, args);
    if (!validation.valid) {
      return corsErrorResponse(`Invalid arguments: ${validation.errors?.join(', ')}`, 400);
    }

    // Execute the requested tool
    const result = await executeTool(name, args, env, ctx);
    
    return corsJsonResponse({
      result: result.result,
      metadata: result.metadata
    });
  } catch (error) {
    console.error(`Error in tool call handler: ${error}`);
    return corsErrorResponse(`Failed to process tool call: ${error}`, 500);
  }
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
        const data = await DataForSEO.getKeywordsData(args, env);
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
        const data = await DataForSEO.getKeywordIdeas(args, env);
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
        const data = await DataForSEO.analyzeContent(args, env);
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
        const data = await DataForSEO.getBacklinks(args, env);
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
        const data = await DataForSEO.analyzeOnPage(args, env);
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