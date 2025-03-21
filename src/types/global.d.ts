import { KVNamespace } from '@cloudflare/workers-types';

declare global {
  interface Env {
    MCP_STORAGE: KVNamespace;
    CONTEXT_DATA: KVNamespace;
    DATAFORSEO_USERNAME: string;
    DATAFORSEO_API_KEY: string;
  }
}

export {}; 