import { WorkflowContext } from '../constants.js';

/**
 * Builds the complete retrieve-payment-credentials payload
 * @param tokenId - Token reference ID (same as enrollmentReferenceId)
 * @param transactionReferenceId - The transaction reference ID to use for this transaction
 * @param context - Workflow context containing shared correlation identifiers
 * @param instructionId - Optional instruction identifier (included in payload only if provided)
 * @param client - Optional client object (included in payload only if provided)
 * @returns Complete retrieve-payment-credentials payload object
 */
export function buildRetrievePaymentCredentialsPayload(
    tokenId: string,
    transactionReferenceId: string,
    context: WorkflowContext,
    instructionId?: string,
    client?: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    clientReferenceId: context.clientReferenceId,
    tokenId,
    transactionData: [
      {
        transactionType: 'PURCHASE',
        transactionReferenceId: transactionReferenceId,
        transactionAmount: {
          transactionCurrencyCode: 'USD',
          transactionAmount: '710',
        },
        shippingAddress: {
          addressId: crypto.randomUUID(),
          line1: '123 Main St',
          line2: 'Apt 1',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          countryCode: 'US',
          deliveryContactDetails: {
            contactFullName: 'Adam Taylor',
            contactEmailAddress: 'abc@gmail.com',
            contactPhoneNumber: {
              countryCode: '1',
              phoneNumber: '6317054545',
              numberIsVoiceOnly: false,
            },
            instructions: 'Leave the package at the door',
          },
        },
        merchantName: 'Best Buy',
        merchantCountryCode: 'US',
        merchantUrl: 'https://www.bestbuy.com',
      },
    ],
  };

  if (instructionId) {
    payload.instructionId = instructionId;
  }

  if (client) {
    payload.client = client;
  }

  return payload;
}