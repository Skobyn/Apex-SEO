/**
 * Type overrides to fix compatibility issues between Cloudflare Workers types and standard DOM types
 */

import { Headers as CFHeaders, Response as CFResponse, WebSocket as CFWebSocket } from '@cloudflare/workers-types';

// Override Response type completely
declare global {
  interface Response {
    readonly status: number;
    readonly ok: boolean;
    readonly redirected: boolean;
    readonly headers: Headers;
    readonly body: ReadableStream<Uint8Array> | null;
    readonly bodyUsed: boolean;
    readonly statusText: string;
    readonly type: ResponseType;
    readonly url: string;
    readonly webSocket: WebSocket | null;
    clone(): Response;
    arrayBuffer(): Promise<ArrayBuffer>;
    blob(): Promise<Blob>;
    formData(): Promise<FormData>;
    json(): Promise<any>;
    text(): Promise<string>;
  }
  
  interface Headers {
    getSetCookie(): string[];
  }
  
  interface AbortSignal {
    finished: Promise<void>;
  }
}

// Add missing methods to Cloudflare's Headers type
declare module '@cloudflare/workers-types' {
  interface Headers extends CFHeaders {
    getSetCookie(): string[];
  }
  
  // Override Response type
  interface Response extends CFResponse {
    readonly webSocket: WebSocket | null;
  }
  
  // Add missing property to AbortSignal
  interface AbortSignal {
    finished: Promise<void>;
  }
}

export {}; 