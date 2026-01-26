# @vic/api-client

VIC API Client for direct VIC API calls with X-Pay authentication and MLE (Message Level Encryption).

## Overview

This package provides a TypeScript client for making direct API calls to VIC (Visa Intelligent Commerce). It handles authentication via X-Pay tokens and automatic MLE encryption/decryption, simplifying integration with Visa Intelligent Commerce APIs.

## Features

- 🔐 **X-Pay Token Authentication** - HMAC-SHA256 automatic token generation
- 🔒 **Automatic MLE Encryption/Decryption** - Transparent message-level encryption
- 📡 **Direct VIC API Integration** - Complete API coverage for VIC operations
- 🎯 **Error Handling with Correlation IDs** - Detailed error tracking and debugging
- ⚙️ **Environment-based Configuration** - Simple setup via VISA\_\* environment variables

## Installation

```bash
npm install @vic/api-client
```

## Required Environment Variables

The client uses the same VISA\_\* environment variables as `@vic/token-manager`:

- `VISA_MCP_BASE_URL` - Base URL for Visa API endpoints
- `VISA_VIC_API_KEY` - VIC API key from Visa onboarding
- `VISA_VIC_API_KEY_SS` - VIC API key shared secret
- `VISA_MLE_SERVER_CERT` - MLE server certificate (PEM format)
- `VISA_MLE_PRIVATE_KEY` - MLE private key (PEM format)
- `VISA_KEY_ID` - Key identifier for MLE operations

## Usage

### Basic Usage

```typescript
import { VicApiClient } from '@vic/api-client';

// Create client (automatically loads from VISA_* environment variables)
const client = new VicApiClient();

// Test VDP connection
const testResponse = await client.testVdpConnection();
console.log('Connection test:', testResponse.data);
```

## Available Methods

### Card Enrollment

- `enrollCard()` - Enroll a card/token in VIC

### Purchase Instructions

- `initiatePurchaseInstruction()` - Create a purchase instruction
- `updatePurchaseInstruction()` - Update an existing instruction
- `cancelPurchaseInstruction()` - Cancel an instruction
- `getTransactionCredentials()` - Get transaction credentials
- `sendConfirmations()` - Send transaction confirmations

### Testing

- `testVdpConnection()` - Test VDP connectivity (non-MLE)

## Architecture Notes

- **Automatic MLE Encryption**: All VIC API calls (except `testVdpConnection`) are automatically encrypted/decrypted
- **X-Pay Token Generation**: Authentication tokens are automatically generated for each request using HMAC-SHA256
- **Shared Configuration**: Uses the same `VISA_*` environment variables as `@vic/token-manager` for consistency
- **Correlation IDs**: Response headers include correlation IDs for debugging and request tracking
