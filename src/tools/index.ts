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
  switch (toolName) {
    case 'dataforseo_serp':
      return await DataForSEO.getSerpResults(parameters, context.env);
      
    case 'dataforseo_keywords_data':
      return await DataForSEO.getKeywordsDataAdvanced(parameters, context.env);
      
    case 'dataforseo_backlinks':
      return await DataForSEO.getBacklinksAdvanced(parameters, context.env);
      
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
} 