import { randomUUID } from 'node:crypto';
import { createXPayToken } from './x-pay-token.js';
import { loadVtsConfig, type ValidatedVtsConfig } from './config.js';
import { getCorrelationId, createEnhancedError } from './api-utils.js';

/**
 * VTS API Client for making authenticated requests to Visa Token Service APIs
 * Handles X-Pay token generation and error handling (no MLE encryption)
 */
export class VtsApiClient {
  private config: ValidatedVtsConfig;

  /**
   * Creates a new VTS API Client instance
   * Credentials are loaded from VISA_VTS_* environment variables
   */
  constructor() {
    this.config = loadVtsConfig();
  }

  /**
   * Makes a request to the VTS API without MLE encryption
   *
   * @param method - HTTP method
   * @param endpoint - API endpoint path (e.g., '/vts/provisionedTokens')
   * @param body - Request body (optional)
   * @param additionalQueryParams - Additional query params to add AFTER apiKey (optional)
   * @returns Promise resolving to the response
   */
  private async makeRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, unknown>,
    additionalQueryParams?: Record<string, string>
  ): Promise<T> {
    // Build full URL with apiKey first, then any additional params
    const queryParams = new URLSearchParams();
    queryParams.set('apiKey', this.config.apiKey);

    // Add additional query params after apiKey (order matters for X-Pay hash)
    if (additionalQueryParams) {
      for (const [key, value] of Object.entries(additionalQueryParams)) {
        queryParams.set(key, value);
      }
    }

    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${this.config.baseUrl}${endpoint}${separator}${queryParams.toString()}`;

    // Prepare request body (no MLE encryption for VTS)
    const requestBody = body ? JSON.stringify(body) : '';

    // Generate X-Pay token
    const xPayToken = createXPayToken({
      sharedSecret: this.config.apiKeySharedSecret,
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
    };

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers,
      ...(requestBody ? { body: requestBody } : {}),
    };

    // Debug logging
    console.log('VTS API Request:', {
      url: url.replace(/apiKey=[^&]+/, 'apiKey=REDACTED'),
      method,
      body: requestBody,
    });

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
      const responseData = await response.json();

      // Check for HTTP errors
      if (!response.ok) {
        throw createEnhancedError(
          response,
          responseData,
          responseHeaders,
          correlationId,
          'VTS API'
        );
      }

      const result = {
        data: responseData,
        correlationId,
      };
      console.log('VTS API Response:', JSON.stringify(result, null, 2));
      return result as T;
    } catch (error) {
      // Re-throw enhanced errors as-is (errors we created via createEnhancedError)
      if (error instanceof Error && 'status' in error) {
        throw error;
      }

      // Enhanced error logging for debugging
      console.error('VTS API fetch error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error ? (error as Error & { cause?: unknown }).cause : undefined,
      });

      // Wrap other errors
      throw new Error(
        `VTS API request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // =====================
  // VTS API Methods
  // =====================

  /**
   * Provisions a token given PAN data
   * POST /vts/provisionedTokens
   */
  async provisionTokenGivenPanData<T = unknown>(request: Record<string, unknown>): Promise<T> {
    return this.makeRequest<T>('POST', '/vts/provisionedTokens', request);
  }

  /**
   * Gets device binding request (step-up options)
   * POST /vts/provisionedTokens/{tokenId}/deviceBinding
   */
  async deviceBindingRequest<T = unknown>(
    tokenId: string,
    request: Record<string, unknown>,
    reasonCode: string = 'PROVISIONING'
  ): Promise<T> {
    return this.makeRequest<T>('POST', `/vts/provisionedTokens/${tokenId}/deviceBinding`, request, {
      reasonCode,
    });
  }

  /**
   * Submits ID&V step-up method
   * PUT /vts/provisionedTokens/{tokenId}/stepUpOptions/method
   */
  async submitIdvStepUpMethod<T = unknown>(
    tokenId: string,
    request: Record<string, unknown>
  ): Promise<T> {
    return this.makeRequest<T>(
      'PUT',
      `/vts/provisionedTokens/${tokenId}/stepUpOptions/method`,
      request
    );
  }

  /**
   * Validates OTP
   * POST /vts/provisionedTokens/{tokenId}/stepUpOptions/validateOTP
   */
  async validateOtp<T = unknown>(tokenId: string, request: Record<string, unknown>): Promise<T> {
    return this.makeRequest<T>(
      'POST',
      `/vts/provisionedTokens/${tokenId}/stepUpOptions/validateOTP`,
      request
    );
  }

  /**
   * Gets token status
   * GET /vts/provisionedTokens/{tokenId}
   */
  async getTokenStatus<T = unknown>(tokenId: string): Promise<T> {
    return this.makeRequest<T>('GET', `/vts/provisionedTokens/${tokenId}`);
  }

  /**
   * Deletes a token
   * PUT /vts/provisionedTokens/{tokenId}/delete
   */
  async deleteToken<T = unknown>(tokenId: string, request: Record<string, unknown>): Promise<T> {
    return this.makeRequest<T>('PUT', `/vts/provisionedTokens/${tokenId}/delete`, request);
  }

  /**
   * Gets device attestation options
   * POST /vts/provisionedTokens/{tokenId}/attestation/options
   */
  async getDeviceAttestationOptions<T = unknown>(
    tokenId: string,
    request: Record<string, unknown>
  ): Promise<T> {
    return this.makeRequest<T>(
      'POST',
      `/vts/provisionedTokens/${tokenId}/attestation/options`,
      request
    );
  }
}
