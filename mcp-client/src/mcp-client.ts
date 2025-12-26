import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Tool, ListToolsResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { z, ZodError, type ZodIssue } from 'zod';
import { TokenManager } from '@vic/token-manager';
import { createChildLogger } from './utils/logger.js';
import { validateToolResponse } from './schemas/tool-responses.js';

// Load environment variables
dotenv.config();

export type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Configuration schema for validation
 */
const VisaMcpClientConfigSchema = z.object({
  serverUrl: z.string().url('Server URL must be a valid URL'),
  clientName: z.string().optional().default('visa-mcp-client'),
  clientVersion: z.string().optional().default('1.0.0'),
  maxRetries: z.number().int().min(0).max(10).optional().default(2),
  validateResponses: z.boolean().optional().default(true),
});

/**
 * Configuration for the Visa MCP Client
 */
export type VisaMcpClientConfig = z.input<typeof VisaMcpClientConfigSchema>;

/**
 * Main client class for connecting to Visa MCP servers
 * Handles authentication, tool discovery, and execution with automatic token refresh
 */
export class VisaMcpClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport | null = null;
  private tokenManager: TokenManager;
  private isConnected: boolean = false;
  private config: z.output<typeof VisaMcpClientConfigSchema>;
  private logger = createChildLogger({ component: 'VisaMcpClient' });

  /**
   * Creates a new Visa MCP Client instance
   * Credentials are loaded from VISA_* environment variables
   *
   * @param config - Configuration object containing server URL and optional client info
   */
  constructor(config: VisaMcpClientConfig) {
    // Validate configuration and apply defaults
    this.config = VisaMcpClientConfigSchema.parse(config);

    // Initialize token manager (loads credentials from environment variables)
    this.tokenManager = new TokenManager();

    this.client = new Client({
      name: this.config.clientName,
      version: this.config.clientVersion,
    });
  }

  /**
   * Ensures client is connected
   * @internal
   */
  private ensureConnected(): void {
    if (!this.isConnected || !this.transport) {
      throw new Error('Client is not connected. Call connect() first.');
    }
  }

  /**
   * Reconnects with a fresh token if current token needs refresh
   * @internal
   */
  private async reconnectIfNeeded(): Promise<void> {
    this.ensureConnected();

    if (!this.tokenManager.needsRefresh()) {
      return;
    }

    this.logger.info('Token expired, reconnecting with new token...');

    if (this.transport) {
      await this.client.close();
      this.transport = null;
      this.isConnected = false;
    }

    const token = await this.tokenManager.getToken();
    if (!token) {
      throw new Error('Failed to obtain authentication token');
    }

    this.transport = new StreamableHTTPClientTransport(new URL(this.config.serverUrl), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    await this.client.connect(this.transport);
    this.isConnected = true;
    this.logger.info('Reconnected to MCP server');
  }

  /**
   * Connects to the Visa MCP server
   * Establishes HTTP streaming transport with Bearer token authentication
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      this.logger.warn('Already connected');
      return;
    }

    const token = await this.tokenManager.getToken();

    if (!token) {
      throw new Error('Failed to obtain authentication token');
    }

    this.transport = new StreamableHTTPClientTransport(new URL(this.config.serverUrl), {
      requestInit: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    await this.client.connect(this.transport);
    this.isConnected = true;
    this.logger.info('Connected to MCP server');
  }

  /**
   * Lists all available tools from the Visa MCP server
   *
   * @returns Array of tools with their names, descriptions, and input schemas
   */
  async listTools(): Promise<Tool[]> {
    await this.reconnectIfNeeded();
    const response: ListToolsResult = await this.client.listTools();
    return response.tools;
  }

  /**
   * Performs a health check on the MCP server connection
   * Verifies that the client is connected and can communicate with the server
   *
   * @returns Health check result with connection status and server info
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    connected: boolean;
    serverReachable: boolean;
    tokenValid: boolean;
    availableTools?: number;
    error?: string;
  }> {
    const result: {
      status: 'healthy' | 'unhealthy';
      connected: boolean;
      serverReachable: boolean;
      tokenValid: boolean;
      availableTools?: number;
      error?: string;
    } = {
      status: 'unhealthy',
      connected: this.isConnected,
      serverReachable: false,
      tokenValid: false,
    };

    try {
      // Check if connected
      if (!this.isConnected) {
        result.error = 'Client is not connected to the server';
        this.logger.warn('Health check failed: not connected');
        return result;
      }

      // Check token validity
      result.tokenValid = !this.tokenManager.needsRefresh();

      // Try to list tools to verify server reachability
      const tools = await this.listTools();
      result.serverReachable = true;
      result.availableTools = tools.length;
      result.status = 'healthy';

      this.logger.info({ toolCount: tools.length }, 'Health check passed');
      return result;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: result.error }, 'Health check failed');
      return result;
    }
  }

  /**
   * Calls a tool on the Visa MCP server
   * Automatically retries on authentication errors and validates responses
   *
   * @param toolName - Name of the tool to call
   * @param args - Arguments to pass to the tool
   * @param retryCount - Internal retry counter (do not use)
   * @returns Tool execution result (validated if schema exists)
   * @throws {ZodError} If response validation fails
   */
  async callTool<T = unknown>(
    toolName: string,
    args: Record<string, unknown>,
    retryCount = 0
  ): Promise<T> {
    const MAX_RETRIES = this.config.maxRetries;

    try {
      await this.reconnectIfNeeded();

      const response = await this.client.callTool({
        name: toolName,
        arguments: args,
      });

      if (response.isError) {
        throw new Error(`MCP tool error: ${JSON.stringify(response)}`);
      }

      const parsedResponse = this.parseToolResponse<T>(response);

      // Validate response if validation is enabled
      if (this.config.validateResponses) {
        try {
          return validateToolResponse<T>(toolName, parsedResponse);
        } catch (validationError) {
          if (validationError instanceof ZodError) {
            this.logger.error(
              { toolName, errors: validationError.issues, response: parsedResponse },
              'Response validation failed'
            );
            throw new Error(
              `Response validation failed for ${toolName}: ${validationError.issues.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
            );
          }
          throw validationError;
        }
      }

      return parsedResponse;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      const isAuthError =
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('Unauthorized');

      if (isAuthError && retryCount < MAX_RETRIES) {
        this.logger.warn(
          { attempt: retryCount + 1, maxAttempts: MAX_RETRIES + 1, error: errorMessage },
          'Auth error, forcing token refresh...'
        );

        this.tokenManager.clearCache();

        return this.callTool(toolName, args, retryCount + 1);
      }

      throw error;
    }
  }

  private parseToolResponse<T>(response: unknown): T {
    // Type guard to check if response has the expected structure
    const hasContent = (obj: unknown): obj is { content: unknown[] } => {
      return (
        typeof obj === 'object' &&
        obj !== null &&
        'content' in obj &&
        Array.isArray((obj as { content: unknown }).content)
      );
    };

    if (!hasContent(response) || response.content.length === 0) {
      throw new Error('Empty response from tool');
    }

    const content = response.content[0];

    // Check if content is a text type
    if (
      typeof content === 'object' &&
      content !== null &&
      'type' in content &&
      content.type === 'text'
    ) {
      const textContent = content as TextContent;
      if (textContent.text) {
        try {
          return JSON.parse(textContent.text) as T;
        } catch {
          return textContent.text as T;
        }
      }
    }

    return response as T;
  }

  /**
   * Closes the connection to the MCP server and cleans up resources
   */
  async close(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    this.isConnected = false;

    if (this.transport) {
      await this.client.close();
      this.transport = null;
    }

    this.tokenManager.clearCache();
    this.logger.info('Disconnected from MCP server');
  }
}

/**
 * Creates and connects a Visa MCP Client from environment variables
 * Convenience function that creates and connects the client in one step
 *
 * @returns Connected VisaMcpClient instance
 */
export async function createVisaMcpClient(): Promise<VisaMcpClient> {
  const baseUrl = process.env.VISA_MCP_BASE_URL;

  if (!baseUrl) {
    throw new Error('Missing required environment variable: VISA_MCP_BASE_URL');
  }

  const client = new VisaMcpClient({
    serverUrl: `${baseUrl}/mcp`,
  });

  await client.connect();
  return client;
}
