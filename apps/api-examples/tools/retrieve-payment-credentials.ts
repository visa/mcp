import type { VicApiClient } from '@vic/api-client';
import { buildRetrievePaymentCredentialsPayload } from '@vic/shared-utils/payload-builders';
import type { WorkflowContext } from '@vic/shared-utils/constants';
import { buildClientObject } from '../utils/api-helpers.js';

/**
 * Parameters for retrieving payment credentials
 */
export interface RetrievePaymentCredentialsParams {
  instructionId: string;
  transactionReferenceId: string;
  context: WorkflowContext;
}

/**
 * Response structure for retrieve-payment-credentials API call
 */
export interface RetrievePaymentCredentialsResponse {
  data: {
    clientReferenceId: string;
    instructionId: string;
    transactionCredentials?: {
      cardNumber?: string;
      expirationDate?: string;
      securityCode?: string;
    };
    status?: string;
  };
  correlationId?: string;
}

/**
 * Calls the get-transaction-credentials API endpoint with constructed payload
 *
 * @param client - VicApiClient instance
 * @param params - Parameters including instructionId, transactionReferenceId, and workflow context
 * @returns Response from get-transaction-credentials API with payment credentials
 * @throws Error if API call fails or required environment variables are missing
 */
export async function retrievePaymentCredentials(
  client: VicApiClient,
  params: RetrievePaymentCredentialsParams
): Promise<RetrievePaymentCredentialsResponse> {
  console.log('\n 📋 Step: Retrieving payment credentials...');

  // Read configuration from environment variables
  const tokenId = process.env.VISA_ENROLLMENT_REFERENCE_ID;

  // Validate required environment variables
  if (!tokenId) {
    throw new Error(
      'Missing required environment variable. Please ensure VISA_ENROLLMENT_REFERENCE_ID ' +
        'is set in your .env file.'
    );
  }

  // Build the payload using configuration and utilities
  const body = buildRetrievePaymentCredentialsPayload(
    tokenId,
    params.transactionReferenceId,
    params.context,
    undefined,
    buildClientObject()
  );

  const response = await client.getTransactionCredentials<RetrievePaymentCredentialsResponse>(
    params.instructionId,
    body
  );

  console.log('  ✅ Payment credentials retrieved successfully');
  console.log(' Full response:', JSON.stringify(response, null, 2));

  return response;
}
