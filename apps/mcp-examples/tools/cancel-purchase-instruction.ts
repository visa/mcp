import type { VisaMcpClient } from '@vic/mcp-client';
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
 * Response structure from cancel-purchase-instruction tool
 */
export interface CancelPurchaseInstructionResponse {
  data: {
    clientReferenceId: string;
    instructionId: string;
    status?: string;
    pendingEvents?: string[];
  };
  correlationId: string;
}

/**
 * Calls the cancel-purchase-instruction MCP tool with constructed payload
 *
 * @param client - Connected VisaMcpClient instance
 * @param params - Parameters including instructionId and workflow context
 * @returns Response from cancel-purchase-instruction tool with cancellation details
 * @throws Error if tool call fails
 */
export async function cancelPurchaseInstruction(
  client: VisaMcpClient,
  params: CancelPurchaseParams
): Promise<CancelPurchaseInstructionResponse> {
  console.log('\n 📋 Step: Cancelling purchase instruction...');

  // Build the payload using configuration and utilities
  const payload = buildCancelPurchaseInstructionPayload(params.instructionId, params.context);

  const response = await client.callTool<CancelPurchaseInstructionResponse>(
    'cancel-purchase-instruction',
    payload
  );

  console.log('  ✅ Purchase instruction cancelled successfully');
  console.log(JSON.stringify(response, null, 2));

  return response;
}
