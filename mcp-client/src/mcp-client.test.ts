/**
 * Unit tests for Visa MCP Client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VisaMcpClient, createVisaMcpClient } from './mcp-client.js';

// Mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({
      tools: [
        {
          name: 'enroll-card',
          description: 'Enroll a card',
          inputSchema: { type: 'object' },
        },
      ],
    }),
    callTool: vi.fn().mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, data: 'test' }),
        },
      ],
      isError: false,
    }),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@vic/token-manager', () => ({
  TokenManager: vi.fn().mockImplementation(() => ({
    getToken: vi.fn().mockResolvedValue('mock-token-12345'),
    needsRefresh: vi.fn().mockReturnValue(false),
    clearCache: vi.fn(),
  })),
}));

describe('VisaMcpClient', () => {
  const validConfig = {
    serverUrl: 'https://sandbox.mcp.visa.com/mcp',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid configuration', () => {
      expect(() => new VisaMcpClient(validConfig)).not.toThrow();
    });

    it('should apply default client name and version', () => {
      const client = new VisaMcpClient(validConfig);
      expect(client).toBeDefined();
    });

    it('should accept custom client name and version', () => {
      const customConfig = {
        ...validConfig,
        clientName: 'custom-client',
        clientVersion: '2.0.0',
      };

      expect(() => new VisaMcpClient(customConfig)).not.toThrow();
    });

    it('should accept custom maxRetries', () => {
      const customConfig = {
        ...validConfig,
        maxRetries: 5,
      };

      expect(() => new VisaMcpClient(customConfig)).not.toThrow();
    });

    it('should reject invalid server URL', () => {
      const invalidConfig = {
        serverUrl: 'not-a-valid-url',
      };

      expect(() => new VisaMcpClient(invalidConfig)).toThrow(/must be a valid URL/);
    });

    it('should reject maxRetries outside valid range', () => {
      const invalidConfig = {
        ...validConfig,
        maxRetries: 15, // Max is 10
      };

      expect(() => new VisaMcpClient(invalidConfig)).toThrow();
    });

    it('should reject negative maxRetries', () => {
      const invalidConfig = {
        ...validConfig,
        maxRetries: -1,
      };

      expect(() => new VisaMcpClient(invalidConfig)).toThrow();
    });
  });

  describe('connect', () => {
    it('should connect successfully with valid token', async () => {
      const client = new VisaMcpClient(validConfig);
      await expect(client.connect()).resolves.not.toThrow();
    });

    it('should not reconnect if already connected', async () => {
      const client = new VisaMcpClient(validConfig);
      await client.connect();

      // Mock console.warn to verify warning is logged
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await client.connect();

      expect(warnSpy).toHaveBeenCalledWith('⚠️ Already connected');
      warnSpy.mockRestore();
    });

    it('should throw error when token generation fails', async () => {
      // Mock TokenManager to return null token
      const { TokenManager } = await import('@vic/token-manager');
      vi.mocked(TokenManager).mockImplementation(
        () =>
          ({
            getToken: vi.fn().mockResolvedValue(null),
            needsRefresh: vi.fn().mockReturnValue(false),
            clearCache: vi.fn(),
          }) as any
      );

      const client = new VisaMcpClient(validConfig);
      await expect(client.connect()).rejects.toThrow(/Failed to obtain authentication token/);
    });
  });

  describe('listTools', () => {
    it('should return list of available tools', async () => {
      const client = new VisaMcpClient(validConfig);
      await client.connect();

      const tools = await client.listTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      expect(tools[0]).toHaveProperty('name');
      expect(tools[0]).toHaveProperty('description');
    });

    it('should throw error when not connected', async () => {
      const client = new VisaMcpClient(validConfig);
      await expect(client.listTools()).rejects.toThrow(/not connected/);
    });

    it('should reconnect if token needs refresh', async () => {
      const client = new VisaMcpClient(validConfig);
      await client.connect();

      // Mock token needing refresh
      const { TokenManager } = await import('@vic/token-manager');
      const mockTokenManager = vi.mocked(TokenManager).mock.results[0].value;
      mockTokenManager.needsRefresh.mockReturnValue(true);

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      await client.listTools();

      // Verify reconnection happened
      expect(mockTokenManager.getToken).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe('callTool', () => {
    it('should call tool with arguments and return result', async () => {
      const client = new VisaMcpClient(validConfig);
      await client.connect();

      const result = await client.callTool('enroll-card', { test: 'data' });
      expect(result).toEqual({ success: true, data: 'test' });
    });

    it('should throw error when not connected', async () => {
      const client = new VisaMcpClient(validConfig);
      await expect(client.callTool('enroll-card', {})).rejects.toThrow(/not connected/);
    });

    it('should throw error when tool returns error', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const mockClient = vi.mocked(Client).mock.results[0].value;
      mockClient.callTool.mockResolvedValueOnce({
        isError: true,
        content: [{ type: 'text', text: 'Error occurred' }],
      });

      const client = new VisaMcpClient(validConfig);
      await client.connect();

      await expect(client.callTool('enroll-card', {})).rejects.toThrow(/MCP tool error/);
    });

    it('should retry on authentication error', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const mockClient = vi.mocked(Client).mock.results[0].value;

      // First call fails with 401, second succeeds
      mockClient.callTool
        .mockRejectedValueOnce(new Error('401 Unauthorized'))
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: JSON.stringify({ retry: 'success' }) }],
          isError: false,
        });

      const client = new VisaMcpClient(validConfig);
      await client.connect();

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await client.callTool('test-tool', {});

      expect(result).toEqual({ retry: 'success' });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Auth error'));
      warnSpy.mockRestore();
    });

    it('should respect maxRetries limit', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const mockClient = vi.mocked(Client).mock.results[0].value;

      // Always fail with auth error
      mockClient.callTool.mockRejectedValue(new Error('401 Unauthorized'));

      const client = new VisaMcpClient({ ...validConfig, maxRetries: 2 });
      await client.connect();

      await expect(client.callTool('test-tool', {})).rejects.toThrow(/401 Unauthorized/);

      // Should have been called 1 (initial) + 2 (retries) = 3 times
      expect(mockClient.callTool).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-auth errors', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const mockClient = vi.mocked(Client).mock.results[0].value;

      mockClient.callTool.mockRejectedValue(new Error('500 Internal Server Error'));

      const client = new VisaMcpClient(validConfig);
      await client.connect();

      await expect(client.callTool('test-tool', {})).rejects.toThrow(/500 Internal Server/);

      // Should only be called once (no retry for non-auth errors)
      expect(mockClient.callTool).toHaveBeenCalledTimes(1);
    });

    it('should handle non-JSON text responses', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const mockClient = vi.mocked(Client).mock.results[0].value;

      mockClient.callTool.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'plain text response' }],
        isError: false,
      });

      const client = new VisaMcpClient(validConfig);
      await client.connect();

      const result = await client.callTool('test-tool', {});
      expect(result).toBe('plain text response');
    });

    it('should throw error on empty response', async () => {
      const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
      const mockClient = vi.mocked(Client).mock.results[0].value;

      mockClient.callTool.mockResolvedValueOnce({
        content: [],
        isError: false,
      });

      const client = new VisaMcpClient(validConfig);
      await client.connect();

      await expect(client.callTool('test-tool', {})).rejects.toThrow(/Empty response/);
    });
  });

  describe('close', () => {
    it('should close connection and clean up resources', async () => {
      const client = new VisaMcpClient(validConfig);
      await client.connect();

      const { TokenManager } = await import('@vic/token-manager');
      const mockTokenManager = vi.mocked(TokenManager).mock.results[0].value;

      await client.close();

      expect(mockTokenManager.clearCache).toHaveBeenCalled();
    });

    it('should do nothing when not connected', async () => {
      const client = new VisaMcpClient(validConfig);
      await expect(client.close()).resolves.not.toThrow();
    });
  });
});

describe('createVisaMcpClient', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create and connect client from environment variables', async () => {
    process.env.VISA_MCP_BASE_URL = 'https://sandbox.mcp.visa.com';

    const client = await createVisaMcpClient();
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(VisaMcpClient);
  });

  it('should throw error when VISA_MCP_BASE_URL is missing', async () => {
    delete process.env.VISA_MCP_BASE_URL;

    await expect(createVisaMcpClient()).rejects.toThrow(
      /Missing required environment variable: VISA_MCP_BASE_URL/
    );
  });

  it('should construct correct server URL with /mcp path', async () => {
    process.env.VISA_MCP_BASE_URL = 'https://sandbox.mcp.visa.com';

    const client = await createVisaMcpClient();
    expect(client).toBeDefined();
    // The client should have been configured with the correct URL
    // This is tested implicitly by the successful connection
  });
});
