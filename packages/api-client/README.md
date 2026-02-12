# @visa/api-client

API clients for VIC and VDP with X-Pay authentication and MLE (Message Level Encryption).

## Overview

This package provides TypeScript clients for making direct API calls to Visa Intelligent Commerce (VIC) and Visa Developer Platform (VDP). It handles authentication via X-Pay tokens and automatic MLE encryption/decryption where required.

## Features

- 🔐 **X-Pay Token Authentication** - HMAC-SHA256 automatic token generation
- 🔒 **Automatic MLE Encryption/Decryption** - Transparent message-level encryption for VIC APIs
- 📡 **Multiple API Clients** - VicApiClient (MLE), VdpApiClient (X-Pay), VdpMutualTlsClient (Two-Way SSL), VtsApiClient (no MLE)
- 🎯 **Error Handling with Correlation IDs** - Detailed error tracking and debugging
- ⚙️ **Environment-based Configuration** - Simple setup via VISA\_\* environment variables

## Installation

```bash
npm install @visa/api-client
```

## Required Environment Variables

### VIC API (VicApiClient)

- `VISA_API_BASE_URL` - Base URL for Visa API endpoints
- `VISA_VIC_API_KEY` - VIC API key from Visa onboarding
- `VISA_VIC_API_KEY_SS` - VIC API key shared secret
- `VISA_MLE_SERVER_CERT` - MLE server certificate (PEM format)
- `VISA_MLE_PRIVATE_KEY` - MLE private key (PEM format)
- `VISA_KEY_ID` - Key identifier for MLE operations

### VDP API — X-Pay Token (VdpApiClient)

- `VISA_API_BASE_URL` - Base URL for Visa API endpoints
- `VISA_VDP_API_KEY` - VDP API key
- `VISA_VDP_API_KEY_SS` - VDP API key shared secret

### VDP API — Two-Way SSL (VdpMutualTlsClient)

- `VISA_API_BASE_URL` - Base URL for Visa API endpoints
- `VISA_VDP_USER_ID` - VDP user ID (from project credentials)
- `VISA_VDP_PASSWORD` - VDP password (from project credentials)
- `VISA_VDP_CLIENT_CERT_PATH` - Path to client certificate file (PEM)
- `VISA_VDP_PRIVATE_KEY_PATH` - Path to private key file (PEM)
- `VISA_VDP_CA_CERT_PATH` - _(Optional)_ Path to CA root certificate file (PEM)

### VTS API (VtsApiClient)

- `VISA_VTS_API_BASE_URL` - Base URL for VTS API endpoints
- `VISA_VTS_API_KEY` - VTS API key
- `VISA_VTS_API_KEY_SS` - VTS API key shared secret

## Usage

### VIC API Client

```typescript
import { VicApiClient } from '@visa/api-client';

// Create client (automatically loads from VISA_* environment variables)
const client = new VicApiClient();

// Enroll a card
const response = await client.enrollCard(enrollmentPayload);
```

### VDP API Client (X-Pay Token)

```typescript
import { VdpApiClient } from '@visa/api-client';

// Create client (loads VDP config from VISA_* environment variables)
const client = new VdpApiClient();

// Test VDP connection
const testResponse = await client.testVdpConnection();
console.log('Connection test:', testResponse.data);
```

### VDP API Client (Two-Way SSL / Mutual TLS)

Uses `curl` subprocess with client certificates and HTTP Basic Auth.

```typescript
import { VdpMutualTlsClient } from '@visa/api-client';

// Create client (loads mutual TLS config from VISA_* environment variables)
const client = new VdpMutualTlsClient();

// Test VDP connection via Two-Way SSL
const testResponse = await client.testVdpConnection();
console.log('Connection test:', testResponse.data);
```

## Available Methods

### VicApiClient

- `enrollCard()` - Enroll a card/token in VIC
- `initiatePurchaseInstruction()` - Create a purchase instruction
- `updatePurchaseInstruction()` - Update an existing instruction
- `cancelPurchaseInstruction()` - Cancel an instruction
- `getTransactionCredentials()` - Get transaction credentials
- `sendConfirmations()` - Send transaction confirmations

### VdpApiClient (X-Pay Token)

- `testVdpConnection()` - Test VDP connectivity (no MLE)

### VdpMutualTlsClient (Two-Way SSL)

- `testVdpConnection()` - Test VDP connectivity via curl with client certificates

### VtsApiClient

- `provisionTokenGivenPanData()` - Provision a token from PAN data
- `deviceBindingRequest()` - Get device binding options
- `submitIdvStepUpMethod()` - Submit ID&V step-up method
- `validateOtp()` - Validate OTP
- `getTokenStatus()` - Get token status
- `deleteToken()` - Delete a token
- `getDeviceAttestationOptions()` - Get device attestation options

## Architecture Notes

- **Automatic MLE Encryption**: VicApiClient calls are automatically encrypted/decrypted
- **No MLE for VDP/VTS**: VdpApiClient and VtsApiClient use plain JSON (no MLE)
- **X-Pay Token Generation**: Authentication tokens are automatically generated for each request using HMAC-SHA256
- **Two-Way SSL**: VdpMutualTlsClient uses native Node.js HTTPS with client certificates and HTTP Basic Auth for mutual TLS authentication
- **Correlation IDs**: Response headers include correlation IDs for debugging and request tracking
