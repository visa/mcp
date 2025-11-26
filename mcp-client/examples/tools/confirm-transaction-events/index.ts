import type { VisaMcpClient } from '../../../src/mcp-client.js';
import { buildConfirmTransactionEventsPayload } from './payload-builder.js';
import type { WorkflowContext } from '../../utils/constants.js';

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
  console.log('\n📋 Step: Confirming transaction events...');

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
