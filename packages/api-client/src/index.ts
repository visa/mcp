/**
 * Visa API Clients
 * Direct API calls with X-Pay authentication
 * - VicApiClient: VIC APIs with MLE encryption
 * - VdpApiClient: VDP APIs without MLE encryption
 * - VtsApiClient: VTS APIs without MLE encryption
 */

// Main clients
export { VicApiClient } from './clients/vic-client.js';
export { VdpApiClient } from './clients/vdp-client.js';
export { VdpMutualTlsClient } from './clients/vdp-mutual-tls-client.js';
export { VtsApiClient } from './clients/vts-client.js';

// Configuration
export { loadVicConfig, loadVdpConfig, loadVdpMutualTlsConfig, loadVtsConfig } from './config.js';
export type {
  ValidatedVicConfig,
  ValidatedVdpConfig,
  ValidatedVdpMutualTlsConfig,
  ValidatedVtsConfig,
} from './config.js';

// Types
export type { VicResponse, XPayTokenParams, MleConfig, VicApiError } from './types.js';

// Utilities
export { createXPayToken } from './x-pay-token.js';
export { encryptPayload, decryptPayload } from './mle.js';
export type { EncryptedPayload } from './mle.js';
