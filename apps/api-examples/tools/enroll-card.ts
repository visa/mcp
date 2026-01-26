import type { VicApiClient } from '@vic/api-client';
import { buildEnrollCardPayload } from '@vic/shared-utils/payload-builders';
import type { WorkflowContext } from '@vic/shared-utils/constants';
import { buildClientObject } from '../utils/api-helpers.js';

/**
 * Response structure for enroll-card API call
 */
export interface EnrollCardResponse {
  data: {
    clientReferenceId: string;
    status: string;
    pendingEvents?: string[];
  };
  correlationId?: string;
}

/**
 * Calls the enroll-card API endpoint with constructed payload
 *
 * @param client - VicApiClient instance
 * @param context - Workflow context containing shared correlation identifiers
 * @returns Response from enroll-card API with clientReferenceId, status, correlationId
 * @throws Error if API call fails or required environment variables are missing
 */
export async function enrollCard(
  client: VicApiClient,
  context: WorkflowContext
): Promise<EnrollCardResponse> {
  console.log('\n 📋 Step: Enrolling card...');

  // Read configuration from environment variables
  const consumerId = process.env.VISA_CONSUMER_ID;
  const enrollmentReferenceId = process.env.VISA_ENROLLMENT_REFERENCE_ID;

  // Validate required environment variables
  if (!consumerId || !enrollmentReferenceId) {
    throw new Error(
      'Missing required environment variables. Please ensure VISA_CONSUMER_ID and ' +
        'VISA_ENROLLMENT_REFERENCE_ID are set in your .env file.'
    );
  }

  // Build the payload using configuration and utilities
  const payload = buildEnrollCardPayload(
    consumerId,
    enrollmentReferenceId,
    context,
    buildClientObject()
  );

  const response = await client.enrollCard<EnrollCardResponse>(payload);

  console.log('  ✅ Card enrolled successfully');
  console.log(' Full response:', JSON.stringify(response, null, 2));

  return response;
}
