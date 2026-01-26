/**
 * VIC API Client
 * Direct VIC API calls with X-Pay authentication and MLE encryption
 */

// Main client
export { VicApiClient } from './client.js';

// Configuration
export { loadVicConfig } from './config.js';
export type { ValidatedVicConfig } from './config.js';

// Types
export type { VicResponse, XPayTokenParams, MleConfig, VicApiError } from './types.js';

// Utilities
export { createXPayToken } from './x-pay-token.js';
export { encryptPayload, decryptPayload } from './mle.js';
export type { EncryptedPayload } from './mle.js';
