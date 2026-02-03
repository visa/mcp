# Visa Intelligent Commerce (VIC) - MCP Integration Starter Kit

This repository provides starter code, examples, and documentation to help external developers integrate their AI agents with VIC Model Context Protocol (MCP) server. It includes Node.js/TypeScript client implementations, authentication patterns, and workflow examples for building agentic commerce experiences.

## Visa Intelligent Commerce

Visa Intelligent Commerce is a new platform and product initiative that enables AI agents to securely browse, shop, and purchase on behalf of consumers, marking a major step toward an era of autonomous, AI-driven commerce experiences.

Visa Intelligent Commerce provides a suite of integrated APIs, tokenized digital credentials, and commercial tools so that AI agents - like chatbots or virtual assistants - can complete transactions on behalf of users within limits set by the consumer. The system is designed to improve security, reduce fraud, and boost the personalization and efficiency of digital shopping experiences for both buyers and merchants.

### How It Works

- **Agent onboarding**: Agents are onboarded onto the Visa Intelligent Commerce platform in order to access the 4 integrated services.
- **Agent specific tokens**: Agents enable users to create accounts and provide users the option to add their Visa cards that can be used by the agent to make purchases on their behalf. This provisioning will include step up verification of the cardholder as well as setting up a Passkey that will be used by the agent to authenticate future instructions.
- **Deliver personalization**: Agents may request the user’s consent to utilize the user insights from Visa to enhance the personalization of the experience.
- **Manage payment instructions**: When an interaction between an agent and a user leads to a recommendation to make one or more purchases, the agent will request whether the user agrees that the agent can make the purchase on the user's behalf.
- **Authentication**: The agent requests the user to authenticate the Payment Instruction using their Passkey and provides that instruction to the Visa Intelligent Commerce platform.
- **Retrieve payment credentials**: When the agent is ready to purchase goods or services from one or more merchants, the agent requests payment credentials. The Visa Intelligent Commerce platform will validate that these requests match the authenticated user instruction and set network level controls.
- **Make payments**: The agent uses the payment credentials received from the Visa Intelligent Commerce platform to complete the purchases at the merchant(s). Initially this payment process will be facilitated using guest checkout, key entry (form fill).
- **Implement transaction controls**: When authorization requests are received by VisaNet, controls will be enforce to ensure that the request originates from the intended merchant for the correct amount.
- **Share commerce signals**: The agent will share the outcome of the purchase made at the merchant with the Visa Intelligent Commerce platform. These signals, along with the user instructions can be used to resolve any disputes that may arise.

### Visa APIs and Integration

- [Visa Intelligent Commerce Capabilities](https://developer.visa.com/capabilities/visa-intelligent-commerce) - Overview of VIC features and capabilities
- [Visa Developer Center](https://developer.visa.com) - Main portal for Visa API documentation, credentials, and testing environments
- [Visa MCP Hub](https://mcp.visa.com) - Central hub for Model Context Protocol server information and integration
- [Visa Developer Quick Start Guide](https://developer.visa.com/pages/working-with-visa-apis/visa-developer-quick-start-guide) - Getting started with Visa APIs
- [X-Pay Token Authentication](https://developer.visa.com/pages/working-with-visa-apis/x-pay-token) - Guide for implementing X-Pay token-based authentication
- [Encryption Guide](https://developer.visa.com/pages/encryption_guide) - Message Level Encryption (MLE) documentation and best practices

## 🚀 Getting Started

This repository provides **two integration approaches** for Visa Intelligent Commerce:
- **MCP-Based Integration** - Use the Model Context Protocol with StreamableHTTP transport for standardized AI agent integration
- **Direct API Integration** - Use direct REST API calls with X-Pay authentication and MLE encryption

Both approaches provide the same VIC capabilities. This repository is organized into key sections to help you integrate:

### 📦 Packages

**Reusable packages for VIC MCP integration**

The `packages/` directory contains shared packages that can be used across different implementations:

- **[@vic/token-manager](./packages/token-manager)** - JWE token generation and management for VIC MCP authentication
  - Automatic token refresh and caching
  - Environment-based credential loading
  - Zod schema validation

- **[@vic/mcp-client](./packages/mcp-client)** - Node.js/TypeScript MCP client for connecting to VIC MCP servers
  - Automatic authentication and token refresh
  - Tool discovery and execution
  - Type-safe API with comprehensive error handling

- **[@vic/api-client](./packages/api-client)** - Direct API client for VIC with X-Pay authentication and MLE
  - X-Pay token authentication (HMAC-SHA256)
  - Automatic MLE encryption/decryption
  - Complete VIC API coverage
  - Environment-based configuration

### 👨‍💻 Client Usage Examples

**Working examples demonstrating VIC client integrations**

The `apps/` directory contains independent example packages:

- **🔐 MCP Client Examples ([mcp-examples/](./apps/mcp-examples))**
  - MCP server connection examples using StreamableHTTP transport
  - Automatic token management patterns
  - Individual tool invocation examples (enroll-card, initiate-purchase-instruction, retrieve-payment-credentials, etc.)
  - Multi-tool workflow orchestration patterns
  - Complete with dependencies, configs, and documentation

- **🚀 API Client Examples ([api-examples/](./apps/api-examples))**
  - Direct REST API integration examples using VicApiClient
  - X-Pay token authentication and MLE encryption patterns
  - End-to-end workflow examples (create/cancel instructions, update instructions, retrieve credentials)
  - Error handling and response processing patterns
  - Complete with dependencies, configs, and documentation

### 🤖 Agent Demo

**Complete end-to-end example of adding a Visa card to VIC**

The [agent/](./agent) directory contains an end-to-end demonstration of the full card enrollment workflow using an AI agent.

- LangGraphJS-powered AI agent with Next.js conversational UI
- **Full VIC card enrollment workflow:**
  - Card tokenization via VTS
  - Device binding with FIDO authentication
  - Step-up verification
  - Visa Payment Passkey creation
  - Assurance data collection and VIC enrollment (`enroll-card`)
- Interactive multi-step flow demonstrating real-world cardholder verification
- Ready to run locally with your Visa credentials

See the [agent setup instructions](./agent/README.md) for configuration details.

## 🏗️ Building the Project

This repository uses npm workspaces with Turbo for efficient build orchestration.

### Initial Setup

```bash
# Install all dependencies (one command for everything)
npm install
```

This installs dependencies for all packages and apps at once, using npm workspaces to hoist shared dependencies to the root.

### Build Commands

```bash
# Build all packages and apps
npm run build

# Build only packages (token-manager, mcp-client, api-client)
npm run build:packages

# Build only apps (mcp-examples, api-examples)
npm run build:apps

# Build packages and agent
npm run build:agent

# Clean all build artifacts
npm run clean
```

## 📚 Visa Intelligent Commerce Documentation MCP Server

A dedicated MCP server that provides AI agents with comprehensive integration guides, examples, and tool definitions for both MCP and direct API integration approaches.

**Learn more:** [VIC Documentation MCP Server Wiki](https://github.com/visa/mcp/wiki/VIC-Documentation-MCP-Server)

### Key Features

- 🛠️ **get-docs** tool for retrieving structured documentation
- 🔐 Authentication patterns and examples
- 📋 Complete tool definitions and payload schemas
- 💡 Best practices for AI-driven implementations
- 🔌 MCP integration guides with StreamableHTTP transport examples
- 🔗 Direct API integration guides with X-Pay and MLE examples
- 🎥 Video walkthrough and usage examples

### Quick Access

**Endpoint:** `https://sandbox.mcp.visa.com/mcp/doc`

Use this server to give your AI agent the full knowledge base required to generate correct integration code and understand Visa MCP workflows.

For detailed information, examples, and the **Gemini CLI extension** setup, visit the [Documentation MCP Server Wiki page](https://github.com/visa/mcp/wiki/VIC-Documentation-MCP-Server).

## 📄 License

See LICENSE file for details
