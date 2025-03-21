/**
 * CORS Headers Utility
 * 
 * This utility provides functions for handling CORS (Cross-Origin Resource Sharing)
 * to allow browsers from different origins to access our API.
 */

import { Response } from '@cloudflare/workers-types';
import '../types/overrides'; // Import our type overrides

// Default CORS headers for responses
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-ID, X-API-Key",
  "Access-Control-Max-Age": "86400", // 24 hours
};

/**
 * Handle CORS preflight requests (OPTIONS method)
 */
export function handleCORS(request: Request): any {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Client-ID",
      "Access-Control-Max-Age": "86400",
    },
  }) as any;
}

/**
 * Add CORS headers to an existing Response
 */
export function addCorsHeaders(response: Response): any {
  // Create a new headers object with CORS headers
  const headersObj = {} as Record<string, string>;
  
  // Copy all existing headers
  for (const [key, value] of Object.entries(Object.fromEntries(response.headers))) {
    headersObj[key] = value;
  }
  
  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headersObj[key] = value;
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headersObj,
  }) as any;
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJsonResponse(data: any, status: number = 200): any {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  }) as any;
}

/**
 * Create a text response with CORS headers
 */
export function corsTextResponse(text: string, status: number = 200): any {
  return new Response(text, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain",
    },
  }) as any;
}

/**
 * Create an error response with CORS headers
 */
export function corsErrorResponse(message: string, status: number = 400): any {
  return corsJsonResponse({ error: message }, status);
} 