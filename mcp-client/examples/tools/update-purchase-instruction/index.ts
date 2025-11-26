import type { VisaMcpClient } from '../../../src/mcp-client.js';
import { buildUpdatePurchaseInstructionPayload } from './payload-builder.js';
import type { WorkflowContext } from '../../utils/constants.js';

/**
 * Parameters for updating a purchase instruction
 */
export interface UpdatePurchaseParams {
  instructionId: string;
  context: WorkflowContext;
}

/**
 * Response structure from update-purchase-instruction tool
 */
export interface UpdatePurchaseInstructionResponse {
  data: {
    clientReferenceId: string;
    instructionId: string;
    status?: string;
    pendingEvents?: string[];
  };
  correlationId: string;
}

/**
 * Calls the update-purchase-instruction MCP tool with constructed payload
 *
 * @param client - Connected VisaMcpClient instance
 * @param params - Parameters including instructionId and workflow context
 * @returns Response from update-purchase-instruction tool with updated instruction details
 * @throws Error if tool call fails or required environment variables are missing
 */
export async function updatePurchaseInstruction(
  client: VisaMcpClient,
  params: UpdatePurchaseParams
): Promise<UpdatePurchaseInstructionResponse> {
  console.log('\n📋 Step: Updating purchase instruction...');

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
  const payload = buildUpdatePurchaseInstructionPayload(
    params.instructionId,
    consumerId,
    tokenId,
    params.context
  );

  const response = await client.callTool<UpdatePurchaseInstructionResponse>(
    'update-purchase-instruction',
    payload
  );

  console.log(' ✅ Purchase instruction updated successfully');
  console.log(JSON.stringify(response, null, 2));

  return response;
}
