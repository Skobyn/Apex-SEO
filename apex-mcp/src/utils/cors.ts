/**
 * CORS Headers Utility
 * 
 * This utility provides functions for handling CORS (Cross-Origin Resource Sharing)
 * to allow browsers from different origins to access our API.
 */

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
export function handleCORS(): Response {
  return new Response(null, {
    status: 204, // No content
    headers: corsHeaders,
  });
}

/**
 * Add CORS headers to an existing Response
 */
export function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Create a text response with CORS headers
 */
export function corsTextResponse(text: string, status: number = 200): Response {
  return new Response(text, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/plain",
    },
  });
}

/**
 * Create an error response with CORS headers
 */
export function corsErrorResponse(message: string, status: number = 400): Response {
  return corsJsonResponse({ error: message }, status);
} 