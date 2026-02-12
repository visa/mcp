import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { request as httpsRequest } from 'node:https';
import { getCorrelationId, extractErrorDetails } from '../api-utils.js';
import { loadVdpMutualTlsConfig, type ValidatedVdpMutualTlsConfig } from '../config.js';
import type { VicApiError } from '../types.js';

/**
 * VDP API Client using Two-Way SSL (Mutual TLS) authentication.
 * Uses native Node.js HTTPS with client certificates and HTTP Basic Auth
 * instead of X-Pay tokens.
 *
 * @see https://developer.visa.com/pages/working-with-visa-apis/two-way-ssl
 */
export class VdpMutualTlsClient {
  private readonly config: ValidatedVdpMutualTlsConfig;
  private readonly key: Buffer;
  private readonly cert: Buffer;
  private readonly ca: Buffer | undefined;

  /**
   * Creates a new VDP Mutual TLS Client instance.
   * Reads client certificate files and loads credentials from VISA_* environment variables.
   */
  constructor() {
    this.config = loadVdpMutualTlsConfig();
    this.key = readFileSync(this.config.privateKeyPath);
    this.cert = readFileSync(this.config.clientCertPath);
    this.ca = this.config.caCertPath ? readFileSync(this.config.caCertPath) : undefined;
  }

  /**
   * Makes an authenticated request to the VDP API using Two-Way SSL.
   *
   * @param method - HTTP method
   * @param endpoint - API endpoint path (e.g., '/vdp/helloworld')
   * @param body - Request body (optional)
   * @returns Promise resolving to the parsed response
   */
  private async makeRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const requestBody = body ? JSON.stringify(body) : undefined;

    // Prepare headers (same pattern as VdpApiClient)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization:
        'Basic ' + Buffer.from(`${this.config.userId}:${this.config.password}`).toString('base64'),
      'x-request-id': randomUUID(),
    };

    let statusCode: number;
    let responseHeaders: Record<string, string>;
    let responseData: unknown;

    try {
      ({ statusCode, responseHeaders, responseData } = await this.executeRequest(
        url,
        method,
        headers,
        requestBody
      ));
    } catch (error) {
      throw new Error(
        `VDP Mutual TLS request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Check for errors
    if (statusCode >= 400) {
      const correlationId = getCorrelationId(responseHeaders);
      const errorDetails = extractErrorDetails(responseData);
      const error = new Error(
        `VDP Mutual TLS API Error: ${statusCode}${errorDetails}`
      ) as VicApiError;
      error.status = statusCode;
      error.correlationId = correlationId;
      error.headers = responseHeaders;
      error.responseData = responseData;
      throw error;
    }

    const result = {
      data: responseData,
      correlationId: getCorrelationId(responseHeaders),
    };

    return result as T;
  }

  /**
   * Executes an HTTPS request with client certificates.
   * Wraps node:https callback API in a Promise.
   */
  private executeRequest(
    url: string,
    method: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<{
    statusCode: number;
    responseHeaders: Record<string, string>;
    responseData: unknown;
  }> {
    return new Promise((resolve, reject) => {
      const req = httpsRequest(
        url,
        {
          method,
          headers,
          key: this.key,
          cert: this.cert,
          ...(this.ca ? { ca: this.ca } : {}),
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => {
            try {
              const rawBody = Buffer.concat(chunks).toString('utf-8');

              // Extract response headers
              const responseHeaders: Record<string, string> = {};
              for (const [key, value] of Object.entries(res.headers)) {
                if (typeof value === 'string') {
                  responseHeaders[key] = value;
                }
              }

              const responseData: unknown = JSON.parse(rawBody);
              resolve({
                statusCode: res.statusCode ?? 0,
                responseHeaders,
                responseData,
              });
            } catch (parseError) {
              reject(parseError instanceof Error ? parseError : new Error(String(parseError)));
            }
          });
        }
      );

      req.on('error', reject);

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  /**
   * Tests connectivity to the Visa Developer Platform (VDP) using Two-Way SSL.
   * GET /vdp/helloworld
   *
   * Makes a simple GET request to /vdp/helloworld using mutual TLS authentication.
   * Useful for verifying Two-Way SSL certificate setup and basic connectivity.
   *
   * @returns Promise resolving to the VDP helloworld response
   */
  async testVdpConnection<T = unknown>(): Promise<T> {
    return this.makeRequest<T>('GET', '/vdp/helloworld');
  }
}
