import { z } from 'zod';

/**
 * Zod schema for VIC API configuration validation
 */
const VicConfigSchema = z.object({
  baseUrl: z.string().url('Base URL must be a valid URL'),
  vicApiKey: z.string().min(1, 'VIC API key is required'),
  vicApiKeySharedSecret: z.string().min(1, 'VIC API key shared secret is required'),
  mleServerCert: z.string().min(1, 'MLE server certificate is required'),
  mlePrivateKey: z.string().min(1, 'MLE private key is required'),
  keyId: z.string().min(1, 'Key ID is required'),
});

export type ValidatedVicConfig = z.infer<typeof VicConfigSchema>;

/**
 * Zod schema for VTS API configuration validation
 * VTS does not use MLE encryption
 */
const VtsConfigSchema = z.object({
  baseUrl: z.string().url('Base URL must be a valid URL'),
  apiKey: z.string().min(1, 'VTS API key is required'),
  apiKeySharedSecret: z.string().min(1, 'VTS API key shared secret is required'),
});

export type ValidatedVtsConfig = z.infer<typeof VtsConfigSchema>;

/**
 * Zod schema for VDP API configuration validation
 * VDP does not use MLE encryption
 */
const VdpConfigSchema = z.object({
  baseUrl: z.string().url('Base URL must be a valid URL'),
  apiKey: z.string().min(1, 'VDP API key is required'),
  apiKeySharedSecret: z.string().min(1, 'VDP API key shared secret is required'),
});

export type ValidatedVdpConfig = z.infer<typeof VdpConfigSchema>;

/**
 * Generic configuration loader that reads VISA_* environment variables,
 * validates them against a Zod schema, and returns the typed config.
 *
 * @param schema - Zod schema to validate against
 * @param envVarMapping - Maps config field names to VISA_ env var suffixes
 * @param apiName - API name for error messages (e.g., 'VIC', 'VTS', 'VDP')
 * @returns Validated configuration object
 * @throws {Error} If required environment variables are missing or invalid
 */
function loadConfig<T extends z.ZodTypeAny>(
  schema: T,
  envVarMapping: Record<string, string>,
  apiName: string
): z.infer<T> {
  const getEnvVar = (key: string): string => {
    const value = process.env[`VISA_${key}`];
    if (!value) {
      throw new Error(`Missing required environment variable: VISA_${key}`);
    }
    return value;
  };

  try {
    const config: Record<string, string> = {};
    for (const [field, envSuffix] of Object.entries(envVarMapping)) {
      config[field] = getEnvVar(envSuffix);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return schema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`Invalid ${apiName} API configuration:\n${issues.join('\n')}`);
    }
    throw new Error(
      `Failed to load ${apiName} API configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Loads VIC API configuration from VISA_* environment variables
 * Matches the same environment variables used by TokenManager
 */
export function loadVicConfig(): ValidatedVicConfig {
  return loadConfig(
    VicConfigSchema,
    {
      baseUrl: 'API_BASE_URL',
      vicApiKey: 'VIC_API_KEY',
      vicApiKeySharedSecret: 'VIC_API_KEY_SS',
      mleServerCert: 'MLE_SERVER_CERT',
      mlePrivateKey: 'MLE_PRIVATE_KEY',
      keyId: 'KEY_ID',
    },
    'VIC'
  );
}

/**
 * Loads VTS API configuration from VISA_* environment variables
 * VTS does not require MLE encryption configuration
 */
export function loadVtsConfig(): ValidatedVtsConfig {
  return loadConfig(
    VtsConfigSchema,
    {
      baseUrl: 'VTS_API_BASE_URL',
      apiKey: 'VTS_API_KEY',
      apiKeySharedSecret: 'VTS_API_KEY_SS',
    },
    'VTS'
  );
}

/**
 * Loads VDP API configuration from VISA_* environment variables
 * VDP does not require MLE encryption configuration
 */
export function loadVdpConfig(): ValidatedVdpConfig {
  return loadConfig(
    VdpConfigSchema,
    {
      baseUrl: 'API_BASE_URL',
      apiKey: 'VDP_API_KEY',
      apiKeySharedSecret: 'VDP_API_KEY_SS',
    },
    'VDP'
  );
}

/**
 * Zod schema for VDP Mutual TLS (Two-Way SSL) API configuration validation
 * Uses client certificates and HTTP Basic Auth instead of X-Pay tokens
 */
const VdpMutualTlsConfigSchema = z.object({
  baseUrl: z.string().url('Base URL must be a valid URL'),
  userId: z.string().min(1, 'VDP user ID is required'),
  password: z.string().min(1, 'VDP password is required'),
  clientCertPath: z.string().min(1, 'Client certificate path is required'),
  privateKeyPath: z.string().min(1, 'Private key path is required'),
  caCertPath: z.string().optional(),
});

export type ValidatedVdpMutualTlsConfig = z.infer<typeof VdpMutualTlsConfigSchema>;

/**
 * Loads VDP Mutual TLS configuration from VISA_* environment variables
 * Used for Two-Way SSL authentication with client certificates
 */
export function loadVdpMutualTlsConfig(): ValidatedVdpMutualTlsConfig {
  const baseConfig = loadConfig(
    VdpMutualTlsConfigSchema.omit({ caCertPath: true }),
    {
      baseUrl: 'API_BASE_URL',
      userId: 'VDP_USER_ID',
      password: 'VDP_PASSWORD',
      clientCertPath: 'VDP_CLIENT_CERT_PATH',
      privateKeyPath: 'VDP_PRIVATE_KEY_PATH',
    },
    'VDP Mutual TLS'
  );

  const caCertPath = process.env.VISA_VDP_CA_CERT_PATH || undefined;

  return { ...baseConfig, caCertPath };
}
