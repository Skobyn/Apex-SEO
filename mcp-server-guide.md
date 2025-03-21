# Building a Model Context Protocol SSE Server on Cloudflare Workers

The Model Context Protocol (MCP) allows external tools to provide additional context to AI assistants like Claude. By building your own MCP server, you can create a custom integration that feeds relevant information to these assistants during conversations.

## Understanding the Basics

First, let's understand what we're building:
- An SSE (Server-Sent Events) server that implements the Model Context Protocol
- Hosted on Cloudflare Workers (serverless platform)
- Accessible to tools like Cursor and Claude

## Prerequisites

Before we start coding, you'll need:
- A Cloudflare account
- Node.js and npm installed locally
- Wrangler CLI (Cloudflare Workers command-line tool)
- A GitHub repository for your code

## Step 1: Set Up Your Development Environment

Let's start by installing the necessary tools:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Create a new project directory
mkdir mcp-sse-server
cd mcp-sse-server

# Initialize a new Worker project
wrangler init
```

During the initialization, choose TypeScript for better type safety, and select the "Hello World" template.

## Step 2: Implement the MCP SSE Server

Let's create the server implementation. Here's the core code you'll need:

```typescript
export interface Env {
  // Define your environment variables here
}

// This is the main Worker script
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return handleCORS();
    }

    // Handle different request paths
    const url = new URL(request.url);
    
    if (url.pathname === "/stream") {
      return handleSSEStream(request, env, ctx);
    }
    
    if (url.pathname === "/submit") {
      return handleSubmission(request, env, ctx);
    }
    
    // Default response for the root path - could be documentation or status
    return new Response("MCP SSE Server is running", {
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};

// Handle CORS preflight requests
function handleCORS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// Handle the SSE stream endpoint
async function handleSSEStream(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Create a new ReadableStream for the SSE connection
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
      
      // You can use a global variable or storage to keep track of data that should be sent
      // For example, you might periodically check for new data and send it
      
      // This is where you'd implement your message queue/handling
      // For now, we'll just leave the connection open
    },
    cancel() {
      // Handle client disconnection
      console.log("Client disconnected from SSE stream");
    },
  });

  return new Response(stream, { headers });
}

// Handle submission of new context data
async function handleSubmission(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // Only accept POST requests
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Parse the submitted data
    const data = await request.json();
    
    // Here you would validate the data according to MCP spec
    // Then store it to be sent via SSE
    
    // For now, let's just acknowledge receipt
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
```

## Step 3: Implement Data Storage and Message Queue

For a complete implementation, you'll need to store and manage the data that will be sent via SSE. For Cloudflare Workers, you have a few options:

1. **Cloudflare KV**: For persistent storage of context data
2. **Durable Objects**: For maintaining connection state and broadcasting updates

Let's enhance our implementation with Cloudflare KV:

```typescript
export interface Env {
  CONTEXT_DATA: KVNamespace;
}

// Update the handleSubmission function to store data in KV
async function handleSubmission(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();
    
    // Generate a unique ID for this context data
    const id = crypto.randomUUID();
    
    // Store in KV with expiration (e.g., 24 hours)
    await env.CONTEXT_DATA.put(id, JSON.stringify(data), { expirationTtl: 86400 });
    
    return new Response(JSON.stringify({ success: true, id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
```

## Step 4: Implement the Full MCP Protocol

Now, let's implement the complete MCP protocol formatting:

```typescript
// src/index.ts
export interface Env {
  CONTEXT_DATA: KVNamespace;
}

interface MCPMessage {
  type: string;
  data?: any;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return handleCORS();
    }

    const url = new URL(request.url);
    
    if (url.pathname === "/v1/stream") {
      return handleMCPStream(request, env, ctx);
    }
    
    if (url.pathname === "/v1/context") {
      return handleContextSubmission(request, env, ctx);
    }
    
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    
    // Default response with documentation
    return new Response(`
      Model Context Protocol SSE Server
      
      Available endpoints:
      - /v1/stream - SSE stream for receiving context
      - /v1/context - Submit new context data
      - /health - Server health check
    `, {
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};

function handleCORS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-ID",
      "Access-Control-Max-Age": "86400",
    },
  });
}

async function handleMCPStream(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  // Get client ID from headers or query parameters
  const clientId = request.headers.get("X-Client-ID") || 
                   new URL(request.url).searchParams.get("client_id") || 
                   "anonymous";
  
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Create a transformer to format messages according to SSE spec
  const encoder = new TextEncoder();
  
  const transformStream = new TransformStream({
    transform(message: MCPMessage, controller) {
      // Format as SSE event
      const event = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
      controller.enqueue(encoder.encode(event));
    }
  });

  // Create the SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected message
      const initialMessage: MCPMessage = {
        type: "connected",
        data: {
          clientId,
          timestamp: new Date().toISOString(),
          server: "cloudflare-mcp-server",
          protocol: "mcp-v1"
        }
      };
      
      controller.enqueue(initialMessage);
      
      // Set up a heartbeat to keep the connection alive
      const heartbeatInterval = setInterval(() => {
        const heartbeat: MCPMessage = {
          type: "heartbeat",
          data: {
            timestamp: new Date().toISOString()
          }
        };
        controller.enqueue(heartbeat);
      }, 30000); // Send heartbeat every 30 seconds
      
      // Store the interval so we can clear it on disconnect
      ctx.waitUntil(
        (async () => {
          // Wait for client to disconnect
          try {
            await request.signal.finished;
          } catch (error) {
            // Request was aborted
          } finally {
            clearInterval(heartbeatInterval);
            console.log(`Client ${clientId} disconnected`);
          }
        })()
      );
    },
    
    pull(controller) {
      // This is where you would check for new context data for this client
      // and send it through the stream
    },
    
    cancel() {
      console.log(`Stream for client ${clientId} cancelled`);
    }
  });

  // Pipe through the transformer to format as SSE
  const sseStream = stream.pipeThrough(transformStream);
  return new Response(sseStream, { headers });
}

async function handleContextSubmission(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const data = await request.json();
    
    // Validate required fields according to MCP spec
    if (!data.clientId || !data.content) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: clientId and content are required" 
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
    
    // Generate a reference ID for this context data
    const contextId = crypto.randomUUID();
    
    // Structure the context data according to MCP format
    const contextData = {
      id: contextId,
      clientId: data.clientId,
      content: data.content,
      metadata: data.metadata || {},
      timestamp: new Date().toISOString(),
      expiresAt: data.expiresAt || new Date(Date.now() + 86400000).toISOString() // Default 24h expiry
    };
    
    // Store in KV with expiration
    await env.CONTEXT_DATA.put(
      `context:${contextId}`, 
      JSON.stringify(contextData),
      { expirationTtl: 86400 }
    );
    
    // Also store a reference in a client-specific list
    const clientContextListKey = `client:${data.clientId}:contexts`;
    const existingList = await env.CONTEXT_DATA.get(clientContextListKey);
    const contextList = existingList ? JSON.parse(existingList) : [];
    contextList.push(contextId);
    
    // Keep only the most recent 100 contexts per client
    if (contextList.length > 100) {
      contextList.shift();
    }
    
    await env.CONTEXT_DATA.put(
      clientContextListKey, 
      JSON.stringify(contextList),
      { expirationTtl: 86400 }
    );
    
    return new Response(JSON.stringify({ 
      success: true, 
      contextId,
      message: "Context data stored successfully" 
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error processing context submission:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to process context data", 
      details: error.message 
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
```

## Step 5: Configure Wrangler and Deploy

Let's set up our `wrangler.toml` file to configure our Worker:

```toml
name = "mcp-sse-server"
main = "src/index.ts"
compatibility_date = "2023-12-01"

# Configure KV namespace
kv_namespaces = [
  { binding = "CONTEXT_DATA", id = "YOUR_KV_ID_HERE", preview_id = "YOUR_PREVIEW_KV_ID" }
]

[triggers]
crons = []
```

You'll need to create a KV namespace first:

```bash
# Create a KV namespace
wrangler kv:namespace create "CONTEXT_DATA"
```

Then update the wrangler.toml file with the KV ID from the output.

## Step 6: Test Locally

Before deploying, let's test our Worker locally:

```bash
wrangler dev
```

This will start a local development server, typically at http://localhost:8787.

You can test the SSE connection using a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>MCP SSE Client Test</title>
</head>
<body>
  <h1>MCP SSE Client Test</h1>
  <div id="events"></div>

  <script>
    const eventsDiv = document.getElementById('events');
    const clientId = 'test-client-' + Math.random().toString(36).substring(7);
    
    // Connect to SSE stream
    const eventSource = new EventSource('http://localhost:8787/v1/stream?client_id=' + clientId);
    
    eventSource.addEventListener('message', function(event) {
      const message = JSON.parse(event.data);
      const eventElement = document.createElement('div');
      eventElement.textContent = JSON.stringify(message);
      eventsDiv.appendChild(eventElement);
    });
    
    eventSource.onerror = function(err) {
      console.error('EventSource error:', err);
    };
  </script>
</body>
</html>
```

## Step 7: Deploy to Cloudflare

When you're ready to deploy:

```bash
wrangler publish
```

After deployment, you'll get a URL for your worker (typically `https://mcp-sse-server.your-username.workers.dev`).

## Step 8: Set Up GitHub Repository

Now, let's get your code into GitHub:

```bash
# Initialize git repository
git init

# Create .gitignore file
echo "node_modules/
dist/
.wrangler/
.env" > .gitignore

# Add and commit files
git add .
git commit -m "Initial commit of MCP SSE Server"

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/mcp-sse-server.git

# Push to GitHub
git push -u origin main
```

## Step 9: Configure Your AI Tools

Now you can connect your MCP server to tools like Cursor or Claude:

### For Cursor:
1. Open Cursor Settings
2. Find the Model Context Protocol section
3. Enter your MCP SSE server URL (https://mcp-sse-server.your-username.workers.dev/v1/stream)
4. Save settings

### For Claude:
1. When using the MCP API, provide your server URL as the `context_server` parameter
2. Alternatively, if using a custom integration, configure it to use your server

## Advanced Features You Can Implement

To make your MCP server more powerful, consider adding these features:

1. **Authentication**: Add API keys to secure your endpoints
2. **Rate Limiting**: Prevent abuse by implementing request limits
3. **Context Filtering**: Allow tools to request specific types of context
4. **Logging and Analytics**: Track usage patterns
5. **Webhooks**: Notify other services when new context is added
