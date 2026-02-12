import type { VicApiClient } from '@visa/api-client';
import { buildInitiatePurchaseInstructionPayload } from '@visa/shared-utils/payload-builders';
import type { WorkflowContext } from '@visa/shared-utils/constants';
import { buildClientObject } from '../utils/api-helpers.js';

/**
 * Response structure for initiate-purchase-instruction API call
 */
export interface InitiatePurchaseInstructionResponse {
  data: {
    clientReferenceId: string;
    instructionId: string;
    status?: string;
    pendingEvents?: string[];
  };
  correlationId?: string;
}

/**
 * Calls the initiate-purchase-instruction API endpoint with constructed payload
 *
 * @param client - VicApiClient instance
 * @param context - Workflow context containing shared correlation identifiers
 * @returns Response from initiate-purchase-instruction API with instructionId and other fields
 * @throws Error if API call fails or required environment variables are missing
 */
export async function initiatePurchaseInstruction(
  client: VicApiClient,
  context: WorkflowContext
): Promise<InitiatePurchaseInstructionResponse> {
  console.log('\n 📋 Step: Initiating purchase instruction...');

  // Read configuration from environment variables
  const consumerId = process.env.VISA_CONSUMER_ID;
  const tokenId = process.env.VISA_ENROLLMENT_REFERENCE_ID;

  // Validate required environment variables
  if (!consumerId || !tokenId) {
    throw new Error(
      'Missing required environment variables. Please ensure VISA_CONSUMER_ID and ' +
        'VISA_ENROLLMENT_REFERENCE_ID are set in your .env file.'
    );
  }

  const payload = buildInitiatePurchaseInstructionPayload(
    consumerId,
    tokenId,
    context,
    buildClientObject()
  );

  const response =
    await client.initiatePurchaseInstruction<InitiatePurchaseInstructionResponse>(payload);

  console.log('  ✅ Purchase instruction initiated successfully');
  console.log(' Full response:', JSON.stringify(response, null, 2));

  return response;
}
