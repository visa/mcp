import {
  APP_INSTANCE_BASE,
  CONSUMER_CONFIG,
  ENROLLMENT_CONFIG,
  WorkflowContext,
} from '../constants.js';
import {
  generateTimestamp,
  generateEffectiveUntil,
  generateNationalIdentifier,
} from '../payload-helpers.js';

/**
 * Builds the complete enroll-card payload
 * @param consumerId - Consumer identifier
 * @param enrollmentReferenceId - Token reference ID from VTS
 * @param context - Workflow context containing shared correlation identifiers
 * @param client - Optional client object (included in payload only if provided)
 * @returns Complete enroll-card payload object
 */
export function buildEnrollCardPayload(
    consumerId: string,
    enrollmentReferenceId: string,
    context: WorkflowContext,
    client?: Record<string, unknown>
): Record<string, unknown> {
  const consentId = crypto.randomUUID();
  const acceptedTime = generateTimestamp();
  const effectiveUntil = generateEffectiveUntil(1);
  const nationalIdentifier = generateNationalIdentifier(CONSUMER_CONFIG.countryCode);

  const payload: Record<string, unknown> = {
    clientReferenceId: context.clientReferenceId,
    consumer: {
      consumerId,
      nationalIdentifier,
      countryCode: CONSUMER_CONFIG.countryCode,
      languageCode: CONSUMER_CONFIG.languageCode,
      consumerIdentity: {
        identityType: 'EMAIL_ADDRESS',
        identityValue: 'test1@test.com',
        identityProvider: 'PARTNER',
        identityProviderUrl: 'https://example.com',
      },
    },
    appInstance: {
      ...APP_INSTANCE_BASE,
      clientDeviceId: context.clientDeviceId,
    },
    enrollmentReferenceData: {
      enrollmentReferenceId,
      enrollmentReferenceType: ENROLLMENT_CONFIG.enrollmentReferenceType,
      enrollmentReferenceProvider: ENROLLMENT_CONFIG.enrollmentReferenceProvider,
    },
    consentData: [
      {
        id: consentId,
        type: 'PERSONALIZATION',
        source: 'CLIENT',
        acceptedTime,
        effectiveUntil,
      },
    ],
  };

  if (client) {
    payload.client = client;
  }

  return payload;
}
