import { randomUUID } from 'node:crypto';
import { createXPayToken } from '../x-pay-token.js';
import { loadVdpConfig, type ValidatedVdpConfig } from '../config.js';
import { getCorrelationId, createEnhancedError } from '../api-utils.js';
import type { VicApiError } from '../types.js';

/**
 * VDP API Client for making authenticated requests to Visa Developer Platform APIs
 * Handles X-Pay token generation and error handling (no MLE encryption)
 */
export class VdpApiClient {
  private config: ValidatedVdpConfig;

  /**
   * Creates a new VDP API Client instance
   * Credentials are loaded from VISA_* environment variables
   */
  constructor() {
    this.config = loadVdpConfig();
  }

  /**
   * Makes a request to the VDP API without MLE encryption
   *
   * @param method - HTTP method
   * @param endpoint - API endpoint path (e.g., '/vdp/helloworld')
   * @param body - Request body (optional)
   * @returns Promise resolving to the response
   */
  private async makeRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    // Build full URL with apikey query parameter
    const url = `${this.config.baseUrl}${endpoint}?apikey=${encodeURIComponent(this.config.apiKey)}`;

    // Prepare request body (no MLE encryption)
    const requestBody = body ? JSON.stringify(body) : '';

    // Generate X-Pay token
    const xPayToken = createXPayToken({
      sharedSecret: this.config.apiKeySharedSecret,
      requestUrl: url,
      body: requestBody,
    });

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-pay-token': xPayToken,
      'x-request-id': randomUUID(),
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

      // Parse response
      const responseData = await response.json();

      // Check for errors
      if (!response.ok) {
        throw createEnhancedError(
          response,
          responseData,
          responseHeaders,
          getCorrelationId(responseHeaders),
          'VDP API'
        );
      }

      const result = {
        data: responseData,
        correlationId: getCorrelationId(responseHeaders),
      };
      return result as T;
    } catch (error) {
      // Re-throw enhanced errors as-is
      if (this.isVdpApiError(error)) {
        throw error;
      }

      // Wrap other errors with VDP-specific context
      throw new Error(
        `VDP connectivity test failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Type guard to check if an error is a VicApiError
   */
  private isVdpApiError(error: unknown): error is VicApiError {
    return error instanceof Error && 'status' in error;
  }

  /**
   * Tests connectivity to the Visa Developer Platform (VDP)
   * GET /vdp/helloworld
   *
   * Makes a simple GET request to /vdp/helloworld without MLE encryption.
   * Useful for verifying basic connectivity and X-Pay authentication.
   *
   * @returns Promise resolving to the VDP helloworld response
   */
  async testVdpConnection<T = unknown>(): Promise<T> {
    return this.makeRequest<T>('GET', '/vdp/helloworld');
  }
}
