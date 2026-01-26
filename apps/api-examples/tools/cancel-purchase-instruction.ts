import type { VicApiClient } from '@vic/api-client';
import { buildCancelPurchaseInstructionPayload } from '@vic/shared-utils/payload-builders';
import type { WorkflowContext } from '@vic/shared-utils/constants';

/**
 * Parameters for cancelling a purchase instruction
 */
export interface CancelPurchaseParams {
  instructionId: string;
  context: WorkflowContext;
}

/**
 * Response structure for cancel-purchase-instruction API call
 */
export interface CancelPurchaseInstructionResponse {
  data: {
    clientReferenceId: string;
    instructionId: string;
    status?: string;
    pendingEvents?: string[];
  };
  correlationId?: string;
}

/**
 * Calls the cancel-purchase-instruction API endpoint with constructed payload
 *
 * @param client - VicApiClient instance
 * @param params - Parameters including instructionId and workflow context
 * @returns Response from cancel-purchase-instruction API with cancellation details
 * @throws Error if API call fails
 */
export async function cancelPurchaseInstruction(
  client: VicApiClient,
  params: CancelPurchaseParams
): Promise<CancelPurchaseInstructionResponse> {
  console.log('\n 📋 Step: Cancelling purchase instruction...');

  // Build the payload using configuration and utilities
  const body = buildCancelPurchaseInstructionPayload(params.context);

  const response = await client.cancelPurchaseInstruction<CancelPurchaseInstructionResponse>(
    params.instructionId,
    body
  );

  console.log('  ✅ Purchase instruction cancelled successfully');
  console.log(' Full response:', JSON.stringify(response, null, 2));

  return response;
}
