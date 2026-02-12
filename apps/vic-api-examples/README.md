# API Client Examples

Complete working examples demonstrating how to use the **[@visa/api-client](../../packages/api-client)** package for direct REST API integration with VIC platform.

## 📖 What This Is

This package contains example code and workflows that demonstrate:

- Direct REST API calls to VIC platform using `VicApiClient`
- Automatic X-Pay token generation and MLE encryption
- End-to-end workflow orchestration
- Error handling and response processing patterns

## Prerequisites

- Node.js >= 18.0.0
- Visa API credentials (VIC, VDP, MLE certificates)
- Consumer ID and Enrollment Reference ID for testing
- **Packages must be built first** (see Building section below)

## Building

Before running the examples, you must build the required packages:

### Option 1: Build Everything

```bash
# From api-examples directory
npm run build
```

This will automatically build all required packages and install dependencies.

### Option 2: Build from Root

```bash
cd ../..
npm run build:packages
```

## Configuration

1. **Copy the environment template**:

   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual Visa credentials**:
   - VIC API credentials (API Key, Shared Secret)
   - MLE certificates and private key
   - Consumer ID and Enrollment Reference ID
   - Visa API base URL

## Running Examples

After building the packages and configuring your environment, run the workflow examples:

### Using npm Scripts (Recommended)

```bash
npm run api:create-cancel
```

### Using tsx Directly

```bash
npx tsx workflows/create-and-cancel-instruction.ts
```

## Project Structure

```
vic-api-examples/
├── workflows/              # End-to-end workflow examples
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── .env.example           # Environment variable template
└── README.md             # This file
```

## Troubleshooting

### "Cannot find module '@visa/api-client'"

Make sure you've built the packages first:

```bash
npm run build
```

### "Missing required environment variables"

Check that:

- `.env` file exists
- All required variables are set
- No extra whitespace in values

### API Errors with Correlation IDs

If you get API errors:

- Check the correlation ID in the error message
- Verify your credentials are correct
- Ensure certificates are in correct PEM format
- Check that Consumer ID and Enrollment Reference ID are valid

## For More Information

- **MCP Examples**: See [MCP Examples](../vic-mcp-examples/README.md) - MCP-based examples using the same APIs
- **VDP Examples**: See [VDP Examples](../vdp-api-examples/README.md) - VDP connectivity testing
- **API Client Package**: See [@visa/api-client README](../../packages/api-client/README.md) - API client implementation details
- **Shared Utils**: See [Shared Utils](../shared-utils/) - Shared utilities for payload building
- **Main Project**: See [Root README](../../README.md)
- **Visa Developer Portal**: [developer.visa.com](https://developer.visa.com)
