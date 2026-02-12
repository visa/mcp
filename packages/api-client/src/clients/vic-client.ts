import { randomUUID } from 'node:crypto';
import { createXPayToken } from '../x-pay-token.js';
import { encryptPayload, decryptPayload } from '../mle.js';
import { loadVicConfig, type ValidatedVicConfig } from '../config.js';
import { getCorrelationId, createEnhancedError } from '../api-utils.js';
import type { VicApiError } from '../types.js';

/**
 * VIC API Client for making authenticated requests to VIC APIs
 * Handles X-Pay token generation, MLE encryption/decryption, and error handling
 */
export class VicApiClient {
  private config: ValidatedVicConfig;

  /**
   * Creates a new VIC API Client instance
   * Credentials are loaded from VISA_* environment variables
   */
  constructor() {
    this.config = loadVicConfig();
  }

  /**
   * Makes a request to the VIC API with MLE encryption
   *
   * @param method - HTTP method
   * @param endpoint - API endpoint path (e.g., '/vacp/v1/cards')
   * @param body - Request body (must be a plain object)
   * @returns Promise resolving to the response
   */
  private async makeRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    // Build full URL with apikey query parameter
    const url = `${this.config.baseUrl}${endpoint}?apikey=${encodeURIComponent(this.config.vicApiKey)}`;

    // Prepare request body with MLE encryption (always enabled)
    let requestBody = '';
    if (body) {
      const encryptedPayload = await encryptPayload(
        body,
        this.config.mleServerCert,
        this.config.keyId
      );
      requestBody = JSON.stringify(encryptedPayload);
    }

    // Generate X-Pay token
    const xPayToken = createXPayToken({
      sharedSecret: this.config.vicApiKeySharedSecret,
      requestUrl: url,
      body: requestBody,
    });

    // Generate unique request ID
    const xRequestId = randomUUID();

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-pay-token': xPayToken,
      'x-request-id': xRequestId,
      keyId: this.config.keyId,
    };

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
      ...(requestBody ? { body: requestBody } : {}),
    };

    try {
      // Make the request
      const response = await fetch(url, fetchOptions);

      // Extract response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Extract correlation ID
      const correlationId = getCorrelationId(responseHeaders);

      // Parse response data
      let responseData = await response.json();

      // Check for HTTP errors
      if (!response.ok) {
        // Handle MLE decryption for error response (same pattern as success)
        if (responseData && this.config.mlePrivateKey?.trim()) {
          try {
            const decryptedError = await decryptPayload(
              responseData,
              this.config.mlePrivateKey,
              this.config.keyId
            );
            responseData = JSON.parse(decryptedError);
          } catch (decryptError) {
            console.log(
              'Failed to decrypt error response:',
              decryptError instanceof Error ? decryptError.message : String(decryptError)
            );
          }
        }
        throw createEnhancedError(
          response,
          responseData,
          responseHeaders,
          correlationId,
          'VIC API'
        );
      }

      // Handle MLE decryption for success response (always enabled)
      if (responseData && this.config.mlePrivateKey?.trim()) {
        const decryptedResponse = await decryptPayload(
          responseData,
          this.config.mlePrivateKey,
          this.config.keyId
        );
        responseData = JSON.parse(decryptedResponse);
      }

      const result = {
        data: responseData,
        correlationId,
      };
      return result as T;
    } catch (error) {
      // Re-throw enhanced errors as-is
      if (this.isVicApiError(error)) {
        throw error;
      }

      // Wrap other errors
      throw new Error(
        `VIC API request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Type guard to check if an error is a VicApiError
   */
  private isVicApiError(error: unknown): error is VicApiError {
    return error instanceof Error && 'status' in error;
  }

  /**
   * Enrolls a card in the VIC platform
   * POST /vacp/v1/cards
   *
   * @param request - Enrollment request data
   * @returns Promise resolving to the enrollment response
   */
  async enrollCard<T = unknown>(request: Record<string, unknown>): Promise<T> {
    return this.makeRequest<T>('POST', '/vacp/v1/cards', request);
  }

  /**
   * Initiates a purchase instruction
   * POST /vacp/v1/instructions
   *
   * @param request - Purchase instruction request data
   * @returns Promise resolving to the purchase instruction response
   */
  async initiatePurchaseInstruction<T = unknown>(request: Record<string, unknown>): Promise<T> {
    return this.makeRequest<T>('POST', '/vacp/v1/instructions', request);
  }

  /**
   * Updates a purchase instruction
   * PUT /vacp/v1/instructions/{instructionId}
   *
   * @param instructionId - The instruction identifier
   * @param request - Update request data
   * @returns Promise resolving to the update response
   */
  async updatePurchaseInstruction<T = unknown>(
    instructionId: string,
    request: Record<string, unknown>
  ): Promise<T> {
    return this.makeRequest<T>('PUT', `/vacp/v1/instructions/${instructionId}`, request);
  }

  /**
   * Cancels a purchase instruction
   * PUT /vacp/v1/instructions/{instructionId}/cancel
   *
   * @param instructionId - The instruction identifier
   * @param request - Cancel request data
   * @returns Promise resolving to the cancel response
   */
  async cancelPurchaseInstruction<T = unknown>(
    instructionId: string,
    request: Record<string, unknown>
  ): Promise<T> {
    return this.makeRequest<T>('PUT', `/vacp/v1/instructions/${instructionId}/cancel`, request);
  }

  /**
   * Gets transaction credentials
   * POST /vacp/v1/instructions/{instructionId}/credentials
   *
   * @param instructionId - The instruction identifier
   * @param request - Credentials request data
   * @returns Promise resolving to the credentials response
   */
  async getTransactionCredentials<T = unknown>(
    instructionId: string,
    request: Record<string, unknown>
  ): Promise<T> {
    return this.makeRequest<T>(
      'POST',
      `/vacp/v1/instructions/${instructionId}/credentials`,
      request
    );
  }

  /**
   * Sends confirmations for a transaction
   * POST /vacp/v1/instructions/{instructionId}/confirmations
   *
   * @param instructionId - The instruction identifier
   * @param request - Confirmations request data
   * @returns Promise resolving to the confirmations response
   */
  async sendConfirmations<T = unknown>(
    instructionId: string,
    request: Record<string, unknown>
  ): Promise<T> {
    return this.makeRequest<T>(
      'POST',
      `/vacp/v1/instructions/${instructionId}/confirmations`,
      request
    );
  }
}
