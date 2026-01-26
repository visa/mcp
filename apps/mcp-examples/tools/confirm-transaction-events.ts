import type { VisaMcpClient } from '@vic/mcp-client';
import { buildConfirmTransactionEventsPayload } from '@vic/shared-utils/payload-builders';
import type { WorkflowContext } from '@vic/shared-utils/constants';

/**
 * Parameters for confirming transaction events
 */
export interface ConfirmTransactionEventsParams {
  instructionId: string;
  transactionReferenceId: string;
  context: WorkflowContext;
}

/**
 * Response structure from confirm-transaction-events tool
 */
export interface ConfirmTransactionEventsResponse {
  data: {
    clientReferenceId: string;
  };
  correlationId: string;
}

/**
 * Calls the confirm-transaction-events MCP tool with constructed payload
 *
 * @param client - Connected VisaMcpClient instance
 * @param params - Parameters including instructionId, transactionReferenceId, and workflow context
 * @returns Response from confirm-transaction-events tool with confirmation details
 * @throws Error if tool call fails
 */
export async function confirmTransactionEvents(
  client: VisaMcpClient,
  params: ConfirmTransactionEventsParams
): Promise<ConfirmTransactionEventsResponse> {
  console.log('\n 📋 Step: Confirming transaction events...');

  // Build the payload using configuration and utilities
  const payload = buildConfirmTransactionEventsPayload(
    params.instructionId,
    params.transactionReferenceId,
    params.context
  );

  const response = await client.callTool<ConfirmTransactionEventsResponse>(
    'confirmations',
    payload
  );

  console.log(' ✅ Transaction events confirmed successfully');
  console.log(JSON.stringify(response, null, 2));

  return response;
}
