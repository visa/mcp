# Visa Client Usage Examples

This directory contains working examples for Visa client packages:

## 📦 Available Example Packages

### [vic-mcp-examples/](./vic-mcp-examples/)
Complete examples demonstrating the **@visa/mcp-client** package for integrating with VIC MCP server.

**Get started:**
```bash
cd vic-mcp-examples
npm install
npm run mcp:connection  # Test MCP server connection
```

See [vic-mcp-examples/README.md](./vic-mcp-examples/README.md) for full documentation.

---

### [vic-api-examples/](./vic-api-examples/)
Complete examples demonstrating the **@visa/api-client** package for direct REST API integration with VIC platform.

**Get started:**
```bash
cd vic-api-examples
npm install
npm run api:create-cancel  # Run a VIC workflow
```

See [vic-api-examples/README.md](./vic-api-examples/README.md) for full documentation.

---

### [vdp-api-examples/](./vdp-api-examples/)

Examples demonstrating VDP connectivity testing using the **@visa/api-client** package.

**Get started:**
```bash
cd vdp-api-examples
npm install
npm run api:test-connection  # Test VDP connection
```

See [vdp-api-examples/README.md](./vdp-api-examples/README.md) for full documentation.

---

## 🔗 Related Packages

- [@visa/mcp-client](../packages/mcp-client/) - MCP Client for Visa Intelligent Commerce
- [@visa/token-manager](../packages/token-manager/) - VIC MCP Authentication
- [@visa/api-client](../packages/api-client/) - REST API Client with X-Pay and MLE support
