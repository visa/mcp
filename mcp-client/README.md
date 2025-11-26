# Visa MCP Client - Node.js

A TypeScript/Node.js client for connecting to Visa's MCP (Model Context Protocol) servers with automatic authentication and token management.

## 📖 What This Is

Starter code and examples demonstrating how to:

- Generate JWE tokens for Visa MCP authentication using @vic/token-manager
- Connect to Visa MCP servers using StreamableHTTP transport
- Call MCP tools with proper authentication and token refresh
- Build end-to-end payment instruction workflows

## ⚠️ What This Is NOT

- This is **NOT** the MCP server itself
- This is **NOT** a production-ready client library
- This is **NOT** a comprehensive SDK

This is example/starter code to help you integrate with Visa MCP quickly.

## Prerequisites

- Node.js >= 18.0.0
- Visa API credentials (VIC, VTS, MLE certificates, signing keys)

## Quick Start

1. **Build the project**:

   ```bash
   cd mcp-client
   npm run build
   ```

   This will:
   - Install and build the `@vic/token-manager` package
   - Install mcp-client dependencies

2. **Configure environment**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your actual Visa credentials.

3. **Run examples**:
   ```bash
   npm run workflow:connection
   ```

## Workflow Examples

After building the project, you can run workflow examples using convenient npm scripts:

```bash
# Basic MCP server connection and tool discovery
npm run workflow:connection

# Enroll card → initiate instruction → cancel
npm run workflow:create-cancel

# Enroll card → initiate instruction → update
npm run workflow:create-update

# Enroll card → initiate → retrieve credentials → confirm transaction
npm run workflow:retrieve-confirm
```

Or run them directly with tsx:

```bash
npx tsx examples/workflows/mcp-server-connection.ts
npx tsx examples/workflows/create-and-cancel-instruction.ts
npx tsx examples/workflows/create-and-update-instruction.ts
npx tsx examples/workflows/retrieve-credentials-confirmations.ts
```

## Available Tools

The MCP client provides access to the following Visa Intelligent Commerce tools:

- **enroll-card** - Enroll a payment card for use with purchase instructions
- **initiate-purchase-instruction** - Create a new purchase instruction with mandate details
- **update-purchase-instruction** - Modify an existing purchase instruction
- **cancel-purchase-instruction** - Cancel a purchase instruction
- **retrieve-payment-credentials** - Get payment credentials for completing a transaction
- **confirm-transaction-events** - Confirm transaction completion and provide commerce signals

## Project Structure

```
examples/
├── tools/           # Individual tool implementations
├── utils/           # Shared utilities (constants, payload-helpers, workflow-helpers)
└── workflows/       # End-to-end workflow examples
```

## Documentation

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Visa Developer Portal](https://developer.visa.com)
- [@vic/token-manager Package](../packages/token-manager/README.md)
