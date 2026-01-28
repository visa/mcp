import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Tool, ListToolsResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { z } from 'zod';
import { TokenManager } from '@vic/token-manager';

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
   * Reconnects with a fresh token if current token needs refresh
   * @internal
   */
  private async reconnectIfNeeded(): Promise<void> {
    if (!this.tokenManager.needsRefresh()) {
      return;
    }

    console.log('🔄 Token expired, reconnecting with new token...');

    if (this.transport) {
      await this.client.close();
      this.transport = null;
      this.isConnected = false;
    }

    // Clear token cache to force generation of a fresh token
    this.tokenManager.clearCache();
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
    console.log(' ✓ Reconnected to MCP server');
  }

  /**
   * Connects to the Visa MCP server
   * Establishes HTTP streaming transport with Bearer token authentication
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('⚠️ Already connected');
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
    console.log(' ✓ Connected to MCP server');
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
   * Calls a tool on the Visa MCP server
   * Automatically retries on authentication errors
   *
   * @param toolName - Name of the tool to call
   * @param args - Arguments to pass to the tool
   * @param retryCount - Internal retry counter (do not use)
   * @returns Tool execution result
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

      return this.parseToolResponse<T>(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      const isAuthError =
        errorMessage.includes('401') ||
        errorMessage.includes('403') ||
        errorMessage.includes('Unauthorized');

      if (isAuthError && retryCount < MAX_RETRIES) {
        console.warn(
          `⚠️ Auth error (attempt ${retryCount + 1}/${MAX_RETRIES + 1}), forcing token refresh...`
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
    console.log('✓ Disconnected from MCP server');
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
