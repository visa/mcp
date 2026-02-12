
# Visa Intelligent Commerce - Agent Demo

AI agent that integrates with Visa Intelligent Commerce (VIC) to demonstrate agentic commerce capabilities. Supports both MCP server integration and direct VDP API calls.

## Tech Stack

- **LangGraphJS** - Agent orchestration
- **Next.js** - Web UI
- **TypeScript**
- **Anthropic Claude / OpenAI GPT** - LLM providers

## Integration Modes

This demo supports two VIC integration approaches, controlled by the `USE_DIRECT_API` environment variable:

| Mode | `USE_DIRECT_API` | Description |
|------|------------------|-------------|
| **MCP Server** | `false` (default)         | Routes API calls through VIC MCP server using `@visa/mcp-client` |
| **Direct VDP API** | `true`           | Calls VDP APIs directly using `@visa/api-client` with X-Pay authentication |

Both modes provide the same functionality. See the [main README](../README.md#-getting-started) for more details on each approach.

## Prerequisites

- Node.js (v18+)
- Visa credentials (see `.env.example`)
- LLM API keys (Anthropic/OpenAI)

## 🚀 Quick Start

1. **Navigate to agent directory**:
   ```bash
   cd vic-agent
   ```
   
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build shared packages:**
   ```bash
   npm run build:packages --prefix ..
   ```
   Required on first setup to compile shared packages (`@visa/mcp-client`, `@visa/api-client`, `@visa/token-manager`).

4. **Configure environment:**
   ```bash
   cp .env.example .env
   cp apps/web/.env.example apps/web/.env.local
   ```
   Edit both `.env` files with your credentials. Set `USE_DIRECT_API=true` for direct VDP calls or `false` for MCP server mode.

5. **Run the application:**
   ```bash
   npm run dev
   ```
- Agent backend: http://localhost:2024
- Web UI: http://localhost:3000

## 🔐 VTS and Passkey Configuration

For VTS authentication and Passkey support, the application must run at `https://localsongbird.com:8188/`.

### Setup Steps:

1. **Add hosts entry:**
   ```bash
   # Add to /etc/hosts (macOS/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows)
   127.0.0.1 localsongbird.com
   ```

2. **Generate SSL certificate:**
   ```bash
   cd apps/web
   mkdir -p .certs
   openssl req -x509 -newkey rsa:4096 -keyout .certs/key.pem -out .certs/cert.pem -days 365 -nodes \
     -subj "/C=US/ST=State/L=City/O=Organization/CN=localsongbird.com" \
     -addext "subjectAltName=DNS:localsongbird.com,DNS:*.localsongbird.com"
   ```

3. **Trust the certificate:**
   - **macOS:** `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain apps/web/.certs/cert.pem`
   - **Linux:** `sudo cp apps/web/.certs/cert.pem /usr/local/share/ca-certificates/localsongbird.crt && sudo update-ca-certificates`
   - **Windows:** Double-click `cert.pem`, install to "Trusted Root Certification Authorities"
   - **Browser:** Import certificate in browser settings if needed

4. **Start the application:**
   ```bash
   # From the root agent folder
   npm run dev
   ```

5. **Access:** `https://localsongbird.com:8188/`

## 📁 Project Structure
```
vic-agent/
└── apps/
    ├── agent/          # LangGraph agent implementation
    └── web/            # Next.js web interface
```

## 📚 References

- [Visa MCP Hub](https://mcp.visa.com)
- [Main Project README](../README.md) - Integration approaches and package documentation
- [@visa/mcp-client](../packages/mcp-client) - MCP client package
- [@visa/api-client](../packages/api-client) - Direct API client package
- [LangGraphJS Documentation](https://github.com/langchain-ai/langgraphjs)
- [Agent Chat UI](https://github.com/langchain-ai/agent-chat-ui)

