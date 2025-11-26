/**
 * Fixed constants used across all workflow examples
 * These values remain the same for all tool calls and workflows
 */

/**
 * Base appInstance object structure used across all tool payloads
 */
export const APP_INSTANCE_BASE = {
  userAgent: 'Mozilla',
  applicationName: 'Agentic Commerce Application',
  countryCode: 'US',
  ipAddress: '128.88.99.100',
  deviceData: {
    type: 'Mobile',
    manufacturer: 'Apple',
    brand: 'Apple',
    model: 'iPhone 16 Pro Max',
  },
} as const;

/**
 * Base assurance data structure for device verification
 * Spread this object and add the dynamic verificationTimestamp
 */
export const ASSURANCE_DATA_BASE = {
  verificationType: 'DEVICE',
  verificationEntity: '10',
  verificationEvents: ['01', '02'],
  verificationMethod: '02',
  verificationResults: '01',
} as const;

/**
 * Consumer configuration
 */
export const CONSUMER_CONFIG = {
  countryCode: 'CA',
  languageCode: 'en',
} as const;

/**
 * Enrollment reference data configuration
 */
export const ENROLLMENT_CONFIG = {
  enrollmentReferenceType: 'TOKEN_REFERENCE_ID',
  enrollmentReferenceProvider: 'VTS',
} as const;

/**
 * Workflow context containing shared identifiers for correlation across all tool calls
 */
export interface WorkflowContext {
  clientReferenceId: string;
  clientDeviceId: string;
}

/**
 * Creates a new workflow context with unique identifiers
 * Call once at the start of each workflow execution to ensure consistent
 * correlation IDs across all API calls in the workflow
 *
 * @returns WorkflowContext with generated UUIDs for clientReferenceId and clientDeviceId
 */
export function createWorkflowContext(): WorkflowContext {
  return {
    clientReferenceId: crypto.randomUUID(),
    clientDeviceId: crypto.randomUUID(),
  };
}
