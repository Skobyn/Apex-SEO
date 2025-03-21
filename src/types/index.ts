/**
 * Type definitions for MCP messages and API responses
 */

// MCP Message Interface
export interface MCPMessage {
  type: string;
  data?: any;
}

// Context Data Interface
export interface ContextData {
  id: string;
  clientId: string;
  content: any;
  metadata?: Record<string, any>;
  timestamp: string;
  expiresAt?: string;
}

// Tool Definition Interface
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Tool Call Request Interface
export interface ToolCallRequest {
  clientId: string;
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

// Tool Response Interface
export interface ToolResponse {
  result: any;
  metadata?: Record<string, any>;
  error?: string;
}

// DataForSEO API Interfaces

// Base API Response
export interface DataForSEOBaseResponse {
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: DataForSEOTask[];
}

// Task structure
export interface DataForSEOTask {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  path: string[];
  data: Record<string, any>;
  result: any[];
}

// SERP API specific interfaces
export interface SERPKeywordData {
  keyword: string;
  location_code: number;
  language_code: string;
  device?: string;
  os?: string;
  target?: string;
}

// Keywords Data API interfaces
export interface KeywordsDataRequest {
  keywords: string[];
  location_code?: number;
  language_code?: string;
}

// Keyword research interfaces
export interface KeywordResearchRequest {
  keyword: string;
  location_code?: number;
  language_code?: string;
}

// Content Analysis interfaces
export interface ContentAnalysisRequest {
  url: string;
  keyword?: string;
}

// Backlinks interfaces
export interface BacklinksRequest {
  target: string;
  limit?: number;
}

// On-Page interfaces
export interface OnPageRequest {
  target: string;
  max_crawl_pages?: number;
} 