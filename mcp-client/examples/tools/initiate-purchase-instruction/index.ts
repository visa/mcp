import type { VisaMcpClient } from '../../../src/mcp-client.js';
import { buildInitiatePurchaseInstructionPayload } from './payload-builder.js';
import type { WorkflowContext } from '../../utils/constants.js';

/**
 * Response structure from initiate-purchase-instruction tool
 */
export interface InitiatePurchaseInstructionResponse {
  data: {
    clientReferenceId: string;
    instructionId: string;
    status?: string;
    pendingEvents?: string[];
  };
  correlationId: string;
}

/**
 * Calls the initiate-purchase-instruction MCP tool with constructed payload
 *
 * @param client - Connected VisaMcpClient instance
 * @param context - Workflow context containing shared correlation identifiers
 * @returns Response from initiate-purchase-instruction tool with instructionId and other fields
 * @throws Error if tool call fails or required environment variables are missing
 */
export async function initiatePurchaseInstruction(
  client: VisaMcpClient,
  context: WorkflowContext
): Promise<InitiatePurchaseInstructionResponse> {
  console.log('\n📋 Step: Initiating purchase instruction...');

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

  const payload = buildInitiatePurchaseInstructionPayload(consumerId, tokenId, context);

  const response = await client.callTool<InitiatePurchaseInstructionResponse>(
    'initiate-purchase-instruction',
    payload
  );

  console.log(' ✅ Purchase instruction initiated successfully');
  console.log(JSON.stringify(response, null, 2));

  return response;
}
