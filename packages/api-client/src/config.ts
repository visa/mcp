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
 * Loads VIC API configuration from VISA_* environment variables
 * Matches the same environment variables used by TokenManager
 *
 * @returns Validated VIC configuration object
 * @throws {Error} If required environment variables are missing or invalid
 */
export function loadVicConfig(): ValidatedVicConfig {
  const getEnvVar = (key: string, required: boolean = true): string => {
    const value = process.env[`VISA_${key}`];

    if (required && !value) {
      throw new Error(`Missing required environment variable: VISA_${key}`);
    }

    return value || '';
  };

  try {
    const config = {
      baseUrl: getEnvVar('API_BASE_URL'),
      vicApiKey: getEnvVar('VIC_API_KEY'),
      vicApiKeySharedSecret: getEnvVar('VIC_API_KEY_SS'),
      mleServerCert: getEnvVar('MLE_SERVER_CERT'),
      mlePrivateKey: getEnvVar('MLE_PRIVATE_KEY'),
      keyId: getEnvVar('KEY_ID'),
    };

    return VicConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`Invalid VIC API configuration:\n${issues.join('\n')}`);
    }
    throw new Error(
      `Failed to load VIC API configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Loads VTS API configuration from VISA_* environment variables
 * VTS does not require MLE encryption configuration
 *
 * @returns Validated VTS configuration object
 * @throws {Error} If required environment variables are missing or invalid
 */
export function loadVtsConfig(): ValidatedVtsConfig {
  const getEnvVar = (key: string, required: boolean = true): string => {
    const value = process.env[`VISA_${key}`];

    if (required && !value) {
      throw new Error(`Missing required environment variable: VISA_${key}`);
    }

    return value || '';
  };

  try {
    // VTS uses a separate base URL (cert.api.visa.com) from VIC (sandbox.api.visa.com)
    const config = {
      baseUrl: getEnvVar('VTS_API_BASE_URL'),
      apiKey: getEnvVar('VTS_API_KEY'),
      apiKeySharedSecret: getEnvVar('VTS_API_KEY_SS'),
    };

    return VtsConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
      throw new Error(`Invalid VTS API configuration:\n${issues.join('\n')}`);
    }
    throw new Error(
      `Failed to load VTS API configuration: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
