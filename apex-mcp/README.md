# Apex MCP Server

An MCP (Model Context Protocol) Server for integrating SEO APIs with AI assistants like Claude, using Cloudflare Workers and SSE.

## Overview

Apex MCP Server provides a bridge between AI assistants and DataForSEO APIs, enabling AI models to access real-time SEO data through the Model Context Protocol. This server implements the MCP specification over Server-Sent Events (SSE) and provides a scalable architecture that can be extended with additional API integrations.

## Features

- **MCP Protocol Implementation**: Provides context discovery, context streaming, and tool execution capabilities following the MCP specification.
- **SEO API Integration**: Direct integration with DataForSEO APIs for comprehensive SEO data access.
- **Real-time Context Streaming**: SSE-based streaming for real-time context updates.
- **Scalable Architecture**: Modular design that allows for easy addition of new API integrations.
- **Cloudflare Workers Deployment**: Serverless deployment on Cloudflare's global network.

## Available SEO Tools

The server provides access to the following SEO tools from DataForSEO:

### SERP Analysis
- `keyword_rankings`: Check keyword rankings for a domain in search results

### Keyword Research
- `keywords_data`: Get search volume and metrics for a list of keywords
- `keyword_ideas`: Get related keyword ideas and suggestions for a seed keyword

### Content Analysis
- `analyze_content`: Analyze content for SEO optimization

### Backlinks
- `backlinks_summary`: Get backlink summary data for a domain or URL

### On-Page SEO
- `analyze_onpage`: Analyze on-page SEO factors for a domain

### Rank Tracking
- `track_keywords`: Track keyword position history for a domain

### Competitor Research
- `find_competitors`: Find competitors for a domain
- `domain_metrics`: Get SEO metrics for a domain

## Setup and Deployment

### Prerequisites

- Cloudflare account
- DataForSEO API credentials
- Node.js and npm installed

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/apex-mcp.git
cd apex-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Create a KV namespace in Cloudflare:
```bash
wrangler kv:namespace create "CONTEXT_DATA"
```

4. Update your `wrangler.toml` with the KV namespace ID and your DataForSEO API key.

5. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Usage with AI Assistants

### With Claude

1. Enable the MCP server in your Claude API calls:
```json
{
  "model": "claude-3-opus-20240229",
  "max_tokens": 1000,
  "temperature": 0.7,
  "context_server": "https://YOUR_WORKER_URL/v1/stream"
}
```

### With Cursor

1. Open Cursor Settings
2. Navigate to the Model Context Protocol section
3. Enter your MCP SSE server URL (https://YOUR_WORKER_URL/v1/stream)
4. Save settings

## API Endpoints

- `GET /v1/stream`: SSE stream for receiving context
- `POST /v1/context`: Submit new context data
- `POST /v1/discover`: Discover available tools and capabilities
- `POST /v1/tools/call`: Call a specific tool
- `GET /health`: Server health check

## Extending with New APIs

To add a new API integration:

1. Create a new service file in `src/services/`
2. Define new tool definitions in `src/tools/index.ts`
3. Add new handlers in `src/handlers/tools.ts`

## License

ISC 