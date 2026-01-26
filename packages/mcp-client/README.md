# @vic/mcp-client

VIC MCP (Model Context Protocol) Client for Node.js - A TypeScript client for connecting to VIC MCP server with automatic authentication and token management.

## Overview

This package provides a complete client implementation for integrating with VIC Model Context Protocol server. It handles authentication, token refresh, tool discovery, and tool execution with built-in retry logic.

## Environment Variables

- `VISA_MCP_BASE_URL` - Base URL for Visa MCP server (used by `createVisaMcpClient()`)
- All authentication credentials are managed by [@vic/token-manager](../token-manager)

## For Complete Examples

For complete usage examples, API documentation, environment variable setup, and working code samples, see the [mcp-examples](../../apps/mcp-examples) directory.

## Used By

This package is used by:

- **[mcp-examples](../../apps/mcp-examples)** - MCP usage examples and workflow demonstrations
- **[agent](../../agent)** - LangGraph agent implementation
