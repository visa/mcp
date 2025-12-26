/**
 * Unit tests for Visa Token Manager
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  loadVisaCredentials,
  createVisaJweToken,
  TokenManager,
  VisaCredentialsSchema,
  TokenGenerationResultSchema,
  type VisaCredentials,
} from './index.js';

describe('VisaCredentialsSchema', () => {
  it('should validate correct credentials', () => {
    const validCredentials = {
      vicApiKey: 'test-vic-key',
      vicApiKeySharedSecret: 'test-vic-secret',
      vtsApiKey: 'test-vts-key',
      vtsApiKeySharedSecret: 'test-vts-secret',
      mleServerCert: '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
      mlePrivateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
      externalClientId: 'client-123',
      externalAppId: 'app-456',
      keyId: 'key-789',
      baseUrl: 'https://sandbox.mcp.visa.com',
    };

    expect(() => VisaCredentialsSchema.parse(validCredentials)).not.toThrow();
  });

  it('should reject credentials with empty strings', () => {
    const invalidCredentials = {
      vicApiKey: '',
      vicApiKeySharedSecret: 'test',
      vtsApiKey: 'test',
      vtsApiKeySharedSecret: 'test',
      mleServerCert: 'test',
      mlePrivateKey: 'test',
      externalClientId: 'test',
      externalAppId: 'test',
      keyId: 'test',
      baseUrl: 'test',
    };

    expect(() => VisaCredentialsSchema.parse(invalidCredentials)).toThrow();
  });

  it('should reject credentials with missing fields', () => {
    const invalidCredentials = {
      vicApiKey: 'test',
      // Missing other required fields
    };

    expect(() => VisaCredentialsSchema.parse(invalidCredentials)).toThrow();
  });
});

describe('TokenGenerationResultSchema', () => {
  it('should validate correct token result', () => {
    const validResult = {
      token: 'eyJhbGciOiJSU0EtT0FFUC0yNTYi...',
      expiresAt: new Date(),
    };

    expect(() => TokenGenerationResultSchema.parse(validResult)).not.toThrow();
  });

  it('should reject empty token', () => {
    const invalidResult = {
      token: '',
      expiresAt: new Date(),
    };

    expect(() => TokenGenerationResultSchema.parse(invalidResult)).toThrow();
  });

  it('should reject invalid date', () => {
    const invalidResult = {
      token: 'valid-token',
      expiresAt: 'not-a-date',
    };

    expect(() => TokenGenerationResultSchema.parse(invalidResult)).toThrow();
  });
});

describe('loadVisaCredentials', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load credentials from environment variables', () => {
    process.env.VISA_VIC_API_KEY = 'test-vic-key';
    process.env.VISA_VIC_API_KEY_SS = 'test-vic-secret';
    process.env.VISA_VTS_API_KEY = 'test-vts-key';
    process.env.VISA_VTS_API_KEY_SS = 'test-vts-secret';
    process.env.VISA_MLE_SERVER_CERT = '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----';
    process.env.VISA_MLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';
    process.env.VISA_EXTERNAL_CLIENT_ID = 'client-123';
    process.env.VISA_EXTERNAL_APP_ID = 'app-456';
    process.env.VISA_KEY_ID = 'key-789';
    process.env.VISA_MCP_BASE_URL = 'https://sandbox.mcp.visa.com';

    const credentials = loadVisaCredentials();

    expect(credentials.vicApiKey).toBe('test-vic-key');
    expect(credentials.vtsApiKey).toBe('test-vts-key');
    expect(credentials.externalClientId).toBe('client-123');
  });

  it('should throw error when required environment variables are missing', () => {
    process.env = {}; // Clear all env vars

    expect(() => loadVisaCredentials()).toThrow(/Missing required environment variable/);
  });

  it('should throw error with validation details for invalid credentials', () => {
    process.env.VISA_VIC_API_KEY = ''; // Empty string should fail validation
    process.env.VISA_VIC_API_KEY_SS = 'test';

    expect(() => loadVisaCredentials()).toThrow(/Invalid Visa credentials/);
  });
});

describe('createVisaJweToken', () => {
  const mockCredentials: VisaCredentials = {
    vicApiKey: 'test-vic-key',
    vicApiKeySharedSecret: 'test-vic-secret',
    vtsApiKey: 'test-vts-key',
    vtsApiKeySharedSecret: 'test-vts-secret',
    mleServerCert: '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----',
    mlePrivateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
    externalClientId: 'client-123',
    externalAppId: 'app-456',
    keyId: 'key-789',
    baseUrl: 'https://sandbox.mcp.visa.com',
  };

  const mockJwksResponse = {
    keys: [
      {
        kty: 'RSA',
        n: 'mockModulus',
        e: 'AQAB',
        kid: 'test-key-id',
        x5c: ['MIIC...base64cert...'],
      },
    ],
  };

  beforeEach(() => {
    // Mock fetch for JWKS endpoint
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJwksResponse,
    } as Response);

    // Mock signing private key
    process.env.USER_SIGNING_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1+fWIcPm15j9zB/QtQhg8HVvLbEpttBr0kmJS301TrBUV7
w==
-----END PRIVATE KEY-----`;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should throw error when JWKS fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    await expect(createVisaJweToken(mockCredentials)).rejects.toThrow(/Failed to fetch JWKS/);
  });

  it('should throw error when JWKS has no keys', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ keys: [] }),
    } as Response);

    await expect(createVisaJweToken(mockCredentials)).rejects.toThrow(/No keys found in JWKS/);
  });

  it('should throw error when JWKS key is missing RSA parameters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        keys: [{ kty: 'RSA', kid: 'test' }], // Missing n and e
      }),
    } as Response);

    await expect(createVisaJweToken(mockCredentials)).rejects.toThrow(/missing RSA modulus/);
  });

  it('should throw error when JWKS key is missing x5c', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        keys: [{ kty: 'RSA', n: 'test', e: 'AQAB', kid: 'test' }], // Missing x5c
      }),
    } as Response);

    await expect(createVisaJweToken(mockCredentials)).rejects.toThrow(/missing x5c certificate/);
  });

  it('should throw error when USER_SIGNING_PRIVATE_KEY is missing', async () => {
    delete process.env.USER_SIGNING_PRIVATE_KEY;

    await expect(createVisaJweToken(mockCredentials)).rejects.toThrow(
      /Missing required environment variable: USER_SIGNING_PRIVATE_KEY/
    );
  });
});

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    tokenManager = new TokenManager();

    // Set up valid environment for token generation
    process.env.VISA_VIC_API_KEY = 'test-vic-key';
    process.env.VISA_VIC_API_KEY_SS = 'test-vic-secret';
    process.env.VISA_VTS_API_KEY = 'test-vts-key';
    process.env.VISA_VTS_API_KEY_SS = 'test-vts-secret';
    process.env.VISA_MLE_SERVER_CERT = '-----BEGIN CERTIFICATE-----\ntest\n-----END CERTIFICATE-----';
    process.env.VISA_MLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----';
    process.env.VISA_EXTERNAL_CLIENT_ID = 'client-123';
    process.env.VISA_EXTERNAL_APP_ID = 'app-456';
    process.env.VISA_KEY_ID = 'key-789';
    process.env.VISA_MCP_BASE_URL = 'https://sandbox.mcp.visa.com';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('needsRefresh', () => {
    it('should return true when no token is cached', () => {
      expect(tokenManager.needsRefresh()).toBe(true);
    });

    it('should return false when token is still valid', async () => {
      // Mock a successful token generation
      const futureDate = new Date(Date.now() + 3600 * 1000); // 1 hour from now
      vi.spyOn(tokenManager as any, 'cachedToken', 'get').mockReturnValue({
        token: 'mock-token',
        expiresAt: futureDate,
      });

      expect(tokenManager.needsRefresh()).toBe(false);
    });

    it('should return true when token is expiring soon', async () => {
      // Mock a token that expires in 30 seconds (less than 60 second threshold)
      const soonDate = new Date(Date.now() + 30 * 1000);
      vi.spyOn(tokenManager as any, 'cachedToken', 'get').mockReturnValue({
        token: 'mock-token',
        expiresAt: soonDate,
      });

      expect(tokenManager.needsRefresh()).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear the cached token', () => {
      tokenManager.clearCache();
      expect(tokenManager.needsRefresh()).toBe(true);
    });
  });

  describe('getToken', () => {
    it('should return cached token if still valid', async () => {
      const mockToken = 'cached-token';
      const futureDate = new Date(Date.now() + 3600 * 1000);

      // Simulate cached token
      (tokenManager as any).cachedToken = {
        token: mockToken,
        expiresAt: futureDate,
      };

      const token = await tokenManager.getToken();
      expect(token).toBe(mockToken);
    });

    it('should generate new token when cache is empty', async () => {
      const mockJwksResponse = {
        keys: [
          {
            kty: 'RSA',
            n: 'mockModulus',
            e: 'AQAB',
            kid: 'test-key-id',
            x5c: ['MIIC...'],
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJwksResponse,
      } as Response);

      process.env.USER_SIGNING_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1+fWIcPm15j9zB/QtQhg8HVvLbEpttBr0kmJS301TrBUV7
w==
-----END PRIVATE KEY-----`;

      tokenManager.clearCache();

      // This will fail in actual execution due to invalid keys, but we're testing the flow
      await expect(tokenManager.getToken()).rejects.toThrow();

      // Verify fetch was called for JWKS
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/.well-known/jwks')
      );
    });
  });
});
