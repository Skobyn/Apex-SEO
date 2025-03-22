/**
 * Tools Registry
 * 
 * This file defines all available tools that can be discovered and used
 * through the MCP interface.
 */

import { ToolDefinition } from '../types';
import { ExecutionContext } from '@cloudflare/workers-types';
import * as DataForSEO from '../services/dataforseo';

// Export the complete tools registry
export const toolsRegistry: Record<string, ToolDefinition> = {
  // SERP Analysis Tools
  keyword_rankings: {
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
  keywords_data: {
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
  
  keyword_ideas: {
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
  analyze_content: {
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
  backlinks_summary: {
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
  analyze_onpage: {
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
  track_keywords: {
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
  find_competitors: {
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
  domain_metrics: {
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
};

// Function to validate tool arguments against their definitions
export function validateToolArguments(
  toolName: string, 
  args: Record<string, any>
): { valid: boolean; errors?: string[] } {
  const toolDef = toolsRegistry[toolName];
  
  if (!toolDef) {
    return { valid: false, errors: [`Tool '${toolName}' not found`] };
  }
  
  const errors: string[] = [];
  
  // Check required parameters
  if (toolDef.parameters.required) {
    for (const requiredParam of toolDef.parameters.required) {
      if (args[requiredParam] === undefined) {
        errors.push(`Missing required parameter: ${requiredParam}`);
      }
    }
  }
  
  // Additional validation could be added here
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

// Define context type for tool execution
interface ToolExecutionContext {
  env: Env;
  ctx: ExecutionContext;
  clientId: string;
}

// Define tool schema
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

// Get all available tools
export function getAllTools(): Tool[] {
  return [
    {
      name: 'dataforseo_serp',
      description: 'Search for results in search engines',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Search query' },
          location_code: { type: 'number', description: 'Location code (default: 2840 for US)' },
          language_code: { type: 'string', description: 'Language code (default: en)' },
          device: { type: 'string', description: 'Device type (desktop or mobile)' }
        },
        required: ['keyword']
      }
    },
    {
      name: 'dataforseo_keywords_data',
      description: 'Get keyword data and suggestions',
      parameters: {
        type: 'object',
        properties: {
          keywords: { 
            type: 'array', 
            items: { type: 'string' },
            description: 'List of keywords to analyze'
          },
          location_code: { type: 'number', description: 'Location code (default: 2840 for US)' },
          language_code: { type: 'string', description: 'Language code (default: en)' }
        },
        required: ['keywords']
      }
    },
    {
      name: 'dataforseo_backlinks',
      description: 'Get backlink data for a domain',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string', description: 'Target domain or URL' },
          limit: { type: 'number', description: 'Maximum number of results (default: 100)' }
        },
        required: ['target']
      }
    }
  ];
}

// Execute a tool call
export async function executeToolCall(
  toolName: string,
  parameters: Record<string, any>,
  context: ToolExecutionContext
): Promise<any> {
  try {
    console.log(`Executing tool: ${toolName} with parameters:`, JSON.stringify(parameters));
    
    switch (toolName) {
      // SERP Analysis Tools
      case 'keyword_rankings':
        try {
          if (!parameters.domain || !parameters.keywords) {
            throw new Error('Missing required parameters: domain and keywords are required');
          }
          
          // Ensure keywords is an array
          const keywords = Array.isArray(parameters.keywords) ? 
                          parameters.keywords : 
                          [parameters.keywords];
          
          // Use getSerpResults with corrected parameter format
          const endpoint = "https://api.dataforseo.com/v3/serp/google/organic/live/advanced";
          
          // Create a task for each keyword
          const requestData = keywords.map(keyword => ({
            keyword,
            target: parameters.domain,
            location_code: parameters.location_code || 2840,
            language_code: parameters.language_code || 'en',
            device: 'desktop'
          }));
          
          console.log('Formatted keyword_rankings request:', JSON.stringify(requestData));
          
          try {
            const response = await DataForSEO.makeDataForSEORequest(endpoint, requestData, context.env);
            
            return {
              success: true,
              result: response,
              metadata: {
                domain: parameters.domain,
                keywords: keywords,
                location_code: parameters.location_code || 2840,
                language_code: parameters.language_code || 'en'
              }
            };
          } catch (error) {
            console.error("Error in SERP API call:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        } catch (error) {
          console.error(`Error executing keyword_rankings: ${error instanceof Error ? error.message : String(error)}`);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      
      // Keyword Data Tools
      case 'keywords_data':
        try {
          if (!parameters.keywords) {
            throw new Error('Missing required parameter: keywords');
          }
          
          // Ensure keywords is an array
          const keywords = Array.isArray(parameters.keywords) ? 
                          parameters.keywords : 
                          [parameters.keywords];
          
          const keywordsRequest = {
            ...parameters,
            keywords: keywords
          };
          
          return await DataForSEO.getKeywordsDataAdvanced(keywordsRequest, context.env);
        } catch (error) {
          console.error(`Error executing keywords_data: ${error instanceof Error ? error.message : String(error)}`);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      
      case 'keyword_ideas':
        try {
          console.log('Executing keyword_ideas with parameters:', JSON.stringify(parameters));
          
          // Ensure parameters are correctly formatted
          const keywordParam = typeof parameters.keyword === 'string' ? parameters.keyword : 
                            (Array.isArray(parameters.keywords) && parameters.keywords.length > 0) ? 
                            parameters.keywords[0] : null;
          
          if (!keywordParam) {
            throw new Error('Missing required parameter: keyword');
          }
          
          // Use the direct API endpoint interface instead of getKeywordIdeas
          const endpoint = "https://api.dataforseo.com/v3/keywords_data/google/keywords_for_keywords/live";
          
          const requestData = [{
            keyword: keywordParam,
            location_code: parameters.location_code || 2840,
            language_code: parameters.language_code || 'en'
          }];
          
          console.log('Formatted request for DataForSEO:', JSON.stringify(requestData));
          
          try {
            const response = await DataForSEO.makeDataForSEORequest(endpoint, requestData, context.env);
            
            return {
              success: true,
              result: response,
              metadata: {
                keyword: keywordParam,
                location_code: parameters.location_code || 2840,
                language_code: parameters.language_code || 'en'
              }
            };
          } catch (error) {
            console.error("Error in Keyword Ideas API call:", error);
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        } catch (error) {
          console.error(`Error executing keyword_ideas: ${error instanceof Error ? error.message : String(error)}`);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      
      // Content Analysis Tools
      case 'analyze_content':
        try {
          if (!parameters.url) {
            throw new Error('Missing required parameter: url');
          }
          
          return await DataForSEO.analyzeContent({
            url: parameters.url,
            keyword: parameters.keyword
          }, context.env);
        } catch (error) {
          console.error(`Error executing analyze_content: ${error instanceof Error ? error.message : String(error)}`);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      
      // Backlinks Tools
      case 'backlinks_summary':
        try {
          if (!parameters.target) {
            throw new Error('Missing required parameter: target');
          }
          
          return await DataForSEO.getBacklinksAdvanced({
            target: parameters.target,
            limit: parameters.limit || 100
          }, context.env);
        } catch (error) {
          console.error(`Error executing backlinks_summary: ${error instanceof Error ? error.message : String(error)}`);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      
      // On-Page Tools
      case 'analyze_onpage':
        try {
          if (!parameters.target) {
            throw new Error('Missing required parameter: target');
          }
          
          return await DataForSEO.analyzeOnPage({
            target: parameters.target,
            max_crawl_pages: parameters.max_crawl_pages || 10
          }, context.env);
        } catch (error) {
          console.error(`Error executing analyze_onpage: ${error instanceof Error ? error.message : String(error)}`);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      
      // Legacy tool names (for backward compatibility)
      case 'dataforseo_serp':
        try {
          return await DataForSEO.getSerpResults(parameters, context.env);
        } catch (error) {
          console.error(`Error executing dataforseo_serp: ${error instanceof Error ? error.message : String(error)}`);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      
      case 'dataforseo_keywords_data':
        try {
          return await DataForSEO.getKeywordsDataAdvanced(parameters, context.env);
        } catch (error) {
          console.error(`Error executing dataforseo_keywords_data: ${error instanceof Error ? error.message : String(error)}`);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      
      case 'dataforseo_backlinks':
        try {
          return await DataForSEO.getBacklinksAdvanced(parameters, context.env);
        } catch (error) {
          console.error(`Error executing dataforseo_backlinks: ${error instanceof Error ? error.message : String(error)}`);
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }
      
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    console.error(`Error in executeToolCall: ${error instanceof Error ? error.message : String(error)}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 