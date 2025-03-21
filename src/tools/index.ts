/**
 * Tools Registry
 * 
 * This file defines all available tools that can be discovered and used
 * through the MCP interface.
 */

import { ToolDefinition } from '../types';

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