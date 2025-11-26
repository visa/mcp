import { WorkflowContext } from '../../utils/constants.js';

/**
 * Builds the complete retrieve-payment-credentials payload
 * @param instructionId - The instruction identifier from initiate-purchase-instruction
 * @param tokenId - Token reference ID (same as enrollmentReferenceId)
 * @param transactionReferenceId - The transaction reference ID to use for this transaction
 * @param context - Workflow context containing shared correlation identifiers
 * @returns Complete retrieve-payment-credentials payload object
 */
export function buildRetrievePaymentCredentialsPayload(
  instructionId: string,
  tokenId: string,
  transactionReferenceId: string,
  context: WorkflowContext
): Record<string, unknown> {
  return {
    instructionId,
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
}
