# Apex MCP Server

An MCP (Model Context Protocol) server that provides AI assistants like Claude with real-time SEO data capabilities. This server integrates with DataForSEO APIs and implements the MCP protocol over SSE (Server-Sent Events).

## Features

- MCP Protocol Implementation (Stream Handler, Tool Discovery, Tool Call Handler)
- DataForSEO API Integration
- Cloudflare Workers Deployment
- KV Storage for state management
- Tool Registry with parameter validation

## Development

### Prerequisites

- Node.js 18+
- Wrangler CLI
- Cloudflare account
- DataForSEO account

### Setup

1. Clone the repository
   ```
   git clone https://github.com/Skobyn/Apex-SEO.git
   cd Apex-SEO
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a KV namespace
   ```
   wrangler kv namespace create "MCP_STORAGE"
   ```

4. Update `wrangler.toml` with your KV namespace ID and API credentials

5. Run locally for development
   ```
   npm run dev
   ```

### Deployment

To deploy to Cloudflare Workers:

```
npm run deploy
```

Alternatively, you can push to the main branch, and GitHub Actions will handle the deployment.

## Testing

A test client is included to verify server functionality. Open `test-client.html` in your browser and configure it to point to your server instance.

## Configuration

### Environment Variables

- `DATAFORSEO_USERNAME`: Your DataForSEO API username
- `DATAFORSEO_API_KEY`: Your DataForSEO API key

### GitHub Secrets for CI/CD

For GitHub Actions deployment, the following secrets are required:

- `CF_API_TOKEN`: Cloudflare API token
- `CF_ACCOUNT_ID`: Cloudflare account ID
- `DATAFORSEO_USERNAME`: DataForSEO username
- `DATAFORSEO_API_KEY`: DataForSEO API key

## License

MIT 