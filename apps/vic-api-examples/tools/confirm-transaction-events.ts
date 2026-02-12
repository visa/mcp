import type { VicApiClient } from '@visa/api-client';
import { buildConfirmTransactionEventsPayload } from '@visa/shared-utils/payload-builders';
import type { WorkflowContext } from '@visa/shared-utils/constants';

/**
 * Parameters for confirming transaction events
 */
export interface ConfirmTransactionEventsParams {
  instructionId: string;
  transactionReferenceId: string;
  context: WorkflowContext;
}

/**
 * Response structure for confirm-transaction-events API call
 */
export interface ConfirmTransactionEventsResponse {
  data: {
    clientReferenceId: string;
    instructionId: string;
    status?: string;
    pendingEvents?: string[];
  };
  correlationId?: string;
}

/**
 * Calls the send-confirmations API endpoint with constructed payload
 *
 * @param client - VicApiClient instance
 * @param params - Parameters including instructionId, transactionReferenceId, and workflow context
 * @returns Response from send-confirmations API with confirmation details
 * @throws Error if API call fails
 */
export async function confirmTransactionEvents(
  client: VicApiClient,
  params: ConfirmTransactionEventsParams
): Promise<ConfirmTransactionEventsResponse> {
  console.log('\n 📋 Step: Confirming transaction events...');

  // Build the payload using configuration and utilities
  const body = buildConfirmTransactionEventsPayload(params.transactionReferenceId, params.context);

  const response = await client.sendConfirmations<ConfirmTransactionEventsResponse>(
    params.instructionId,
    body
  );

  console.log('  ✅ Transaction events confirmed successfully');
  console.log(' Full response:', JSON.stringify(response, null, 2));

  return response;
}
