# Visa Intelligent Commerce - Gemini CLI Extension

A Gemini CLI extension that includes a tool with Visa Intelligent Commerce documentation

## Visa Intelligent Commerce

Visa Intelligent Commerce is a new platform and product initiative that enables AI agents to securely browse, shop, and purchase on behalf of consumers, marking a major step toward an era of autonomous, AI-driven commerce experiences.

Visa Intelligent Commerce provides a suite of integrated APIs, tokenized digital credentials, and commercial tools so that AI agents - like chatbots or virtual assistants - can complete transactions on behalf of users within limits set by the consumer. The system is designed to improve security, reduce fraud, and boost the personalization and efficiency of digital shopping experiences for both buyers and merchants.

## 🚀 Installation

### 1. Install Extension

Install the extension using the `gemini extensions install` command:
```bash
gemini extensions install https://github.com/visa/mcp
```

### 2. Activate

Restart the Gemini CLI.


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

### Visa Agent APIs and Integration

- [Visa developer center](https://developer.visa.com/capabilities/visa-Intelligent-commerce): Access to Visa Intelligent Commerce API
- [Visa MCP Hub](https://mcp.visa.com): Connect to Visa’s Model Context Protocol (MCP) server to simplify the process of integrating Visa APIs into your agentic workflows.
