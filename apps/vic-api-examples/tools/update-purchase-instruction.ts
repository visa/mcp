import type { VicApiClient } from '@visa/api-client';
import { buildUpdatePurchaseInstructionPayload } from '@visa/shared-utils/payload-builders';
import type { WorkflowContext } from '@visa/shared-utils/constants';
import { buildClientObject } from '../utils/api-helpers.js';

/**
 * Parameters for updating a purchase instruction
 */
export interface UpdatePurchaseParams {
  instructionId: string;
  context: WorkflowContext;
}

/**
 * Response structure for update-purchase-instruction API call
 */
export interface UpdatePurchaseInstructionResponse {
  data: {
    clientReferenceId: string;
    instructionId: string;
    status?: string;
    pendingEvents?: string[];
  };
  correlationId?: string;
}

/**
 * Calls the update-purchase-instruction API endpoint with constructed payload
 *
 * @param client - VicApiClient instance
 * @param params - Parameters including instructionId and workflow context
 * @returns Response from update-purchase-instruction API with update details
 * @throws Error if API call fails or required environment variables are missing
 */
export async function updatePurchaseInstruction(
  client: VicApiClient,
  params: UpdatePurchaseParams
): Promise<UpdatePurchaseInstructionResponse> {
  console.log('\n 📋 Step: Updating purchase instruction...');

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

  // Build the payload using configuration and utilities
  const body = buildUpdatePurchaseInstructionPayload(
    consumerId,
    tokenId,
    params.context,
    undefined,
    buildClientObject()
  );

  const response = await client.updatePurchaseInstruction<UpdatePurchaseInstructionResponse>(
    params.instructionId,
    body
  );

  console.log('  ✅ Purchase instruction updated successfully');
  console.log(' Full response:', JSON.stringify(response, null, 2));

  return response;
}
