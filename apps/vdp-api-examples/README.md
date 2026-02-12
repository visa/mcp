# VDP API Examples

Working examples demonstrating connectivity testing with the Visa Developer Platform (VDP) using the **[@visa/api-client](../../packages/api-client)** package.

## 📖 What This Is

This package contains example code for:

- Testing VDP connectivity using `VdpApiClient` (X-Pay token authentication)
- Testing VDP connectivity using `VdpMutualTlsClient` (Two-Way SSL / Mutual TLS authentication)

## Prerequisites

- Node.js >= 18.0.0
- Visa API credentials (see authentication methods below)
- **Packages must be built first** (see Building section below)

## Building

```bash
# From project root
npm run build:packages
```

## Configuration

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual Visa credentials

## Running Examples

| Example     | Command                                  | Requires                                                                                                        |
| ----------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| X-Pay Token | `npm run api:test-connection`            | API key + shared secret in `.env`                                                                               |
| Two-Way SSL | `npm run api:test-connection-mutual-tls` | API key + shared secret in `.env`, client certificates in `certs/` (see [`certs/README.md`](./certs/README.md)) |

See [`.env.example`](./.env.example) for all required environment variables. For details on obtaining certificates, see the [Visa Two-Way SSL documentation](https://developer.visa.com/pages/working-with-visa-apis/two-way-ssl).

## For More Information

- **VIC API Examples**: See [VIC API Examples](../vic-api-examples/README.md)
- **MCP Examples**: See [MCP Examples](../vic-mcp-examples/README.md)
- **API Client Package**: See [@visa/api-client README](../../packages/api-client/README.md)
- **Main Project**: See [Root README](../../README.md)
