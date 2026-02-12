# VIC MCP Client - Usage Examples

Complete working examples demonstrating how to use the **[@visa/mcp-client](../../packages/mcp-client)** package for integrating with VIC MCP server.

## 📖 What This Is

This package contains example code and workflows that demonstrate:

- How to connect to VIC MCP server using `@visa/mcp-client`
- Authentication patterns with automatic token management
- Individual tool invocation examples with payload builders
- End-to-end workflow orchestration patterns
- Error handling and response processing

## Prerequisites

- Node.js >= 18.0.0
- Visa API credentials (VIC, VTS, MLE certificates, signing keys)
- **Packages must be built first** (see Building section below)

## Building

Before running the examples, you must build the required packages:

### Option 1: Build Everything from Root

```bash
cd ../..
npm run build
```

### Option 2: Build Packages Individually

```bash
# Build token-manager
cd ../../packages/token-manager
npm install
npm run build

# Build mcp-client
cd ../mcp-client
npm install
npm run build
```

This will automatically build both packages and install the dependencies for mcp-examples.

## Configuration

1. **Copy the environment template**:

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual Visa credentials**:
   - VIC API credentials
   - VTS API credentials
   - MLE certificates and private key
   - Your JWT signing private key
   - MCP server base URL

## Running Examples

After building the packages and configuring your environment, run the workflow examples:

### Using npm Scripts (Recommended)

```bash
npm run mcp:connection
npm run mcp:create-cancel
npm run mcp:create-update
npm run mcp:retrieve-confirm
```

## Available Tools

The examples demonstrate these Visa Intelligent Commerce MCP tools:

- **enroll-card** - Enroll a payment card for use with purchase instructions
- **initiate-purchase-instruction** - Create a new purchase instruction with mandate details
- **update-purchase-instruction** - Modify an existing purchase instruction
- **cancel-purchase-instruction** - Cancel a purchase instruction
- **retrieve-payment-credentials** - Get payment credentials for completing a transaction
- **confirm-transaction-events** - Confirm transaction completion and provide commerce signals

## Project Structure

```
vic-mcp-examples/
├── tools/              # Individual MCP tool implementations
├── workflows/          # End-to-end workflow examples
├── utils/              # MCP-specific utilities
├── package.json        # Dependencies and scripts
├── .env                # Environment configuration (copy from .env.example)
├── .env.example        # Environment template
└── README.md           # This file
```

## Environment Variables

All examples load credentials from the `.env` file.
See `.env.example` for details.

## Troubleshooting

### "Cannot find module '@visa/mcp-client'"

Make sure you've built the packages first:

```bash
cd ../..
npm run build:packages
```

### "Failed to obtain authentication token"

Check that all required environment variables are set in your `.env` file.

### "Connection failed"

Verify that:

- `VISA_MCP_BASE_URL` is correct
- Your credentials are valid
- You have network connectivity to the MCP server

## For More Information

- **MCP Client API**: See [@visa/mcp-client README](../../packages/mcp-client/README.md)
- **Token Management**: See [@visa/token-manager README](../../packages/token-manager/README.md)
- **Main Project**: See [Root README](../../README.md)
- **Visa Developer Portal**: [developer.visa.com](https://developer.visa.com)
- **Visa MCP Hub**: [mcp.visa.com](https://mcp.visa.com)
