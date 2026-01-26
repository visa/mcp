import type { VisaMcpClient } from '@vic/mcp-client';
import { buildRetrievePaymentCredentialsPayload } from '@vic/shared-utils/payload-builders';
import type { WorkflowContext } from '@vic/shared-utils/constants';

/**
 * Parameters for retrieving payment credentials
 */
export interface RetrievePaymentCredentialsParams {
  instructionId: string;
  transactionReferenceId: string;
  context: WorkflowContext;
}

/**
 * Response structure from retrieve-payment-credentials tool
 */
export interface RetrievePaymentCredentialsResponse {
  data: {
    clientReferenceId: string;
    instructionId: string;
    status?: string;
    authorization?: string;
    signedPayload?: string;
    pendingEvents?: string[];
  };
  correlationId: string;
}

/**
 * Calls the retrieve-payment-credentials MCP tool with constructed payload
 *
 * @param client - Connected VisaMcpClient instance
 * @param params - Parameters including instructionId and workflow context
 * @returns Response from retrieve-payment-credentials tool with payment credentials
 * @throws Error if tool call fails or required environment variables are missing
 */
export async function retrievePaymentCredentials(
  client: VisaMcpClient,
  params: RetrievePaymentCredentialsParams
): Promise<RetrievePaymentCredentialsResponse> {
  console.log('\n 📋 Step: Retrieving payment credentials...');

  // Read configuration from environment variables
  const tokenId = process.env.VISA_ENROLLMENT_REFERENCE_ID;

  // Validate required environment variables
  if (!tokenId) {
    throw new Error(
      'Missing required environment variable. Please ensure ' +
        'VISA_ENROLLMENT_REFERENCE_ID is set in your .env file.'
    );
  }

  // Build the payload using configuration and utilities
  const payload = buildRetrievePaymentCredentialsPayload(
    tokenId,
    params.transactionReferenceId,
    params.context,
    params.instructionId
  );

  const response = await client.callTool<RetrievePaymentCredentialsResponse>(
    'get-transaction-credentials',
    payload
  );

  console.log(' ✅ Payment credentials retrieved successfully');
  console.log(JSON.stringify(response, null, 2));

  return response;
}
