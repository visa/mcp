import { WorkflowContext } from '../../utils/constants.js';
import { generateTimestamp } from '../../utils/payload-helpers.js';

/**
 * Builds the complete confirm-transaction-events payload
 * @param instructionId - The instruction identifier from initiate-purchase-instruction
 * @param transactionReferenceId - The transaction reference ID used in retrieve-payment-credentials
 * @param context - Workflow context containing shared correlation identifiers
 * @returns Complete confirm-transaction-events payload object
 */
export function buildConfirmTransactionEventsPayload(
  instructionId: string,
  transactionReferenceId: string,
  context: WorkflowContext
): Record<string, unknown> {
  const currentTimestamp = generateTimestamp();
  const futureTimestamp = (parseInt(currentTimestamp) + 86400 * 7).toString();

  return {
    instructionId,
    clientReferenceId: context.clientReferenceId,
    confirmationData: [
      {
        transactionReferenceId,
        paymentConfirmationData: {
          transactionType: 'PURCHASE',
          transactionStatus: 'APPROVED',
          transactionTimestamp: currentTimestamp,
          responseCode: '00',
          authorizationCode: `AUTH-${crypto.randomUUID()}`,
          retrievalReferenceNumber: `RRN-${crypto.randomUUID().substring(0, 12)}`,
          systemTraceAuditNumber: `STAN-${crypto.randomUUID().substring(0, 12)}`,
          transactionAmount: {
            transactionAmount: '710',
            transactionCurrencyCode: 'USD',
          },
          cardEntryMode: 'ECOMMERCE',
        },
        orderData: {
          orderId: `ORDER-${crypto.randomUUID()}`,
          orderStatus: 'COMPLETED',
          orderDate: currentTimestamp,
          expectedDeliveryDate: futureTimestamp,
          transactionAmount: {
            transactionAmount: '710',
            transactionCurrencyCode: 'USD',
          },
        },
        merchantData: {
          merchantName: 'Best Buy',
        },
        shippingData: {
          trackingId: `TRACK-${crypto.randomUUID().substring(0, 18)}`,
          carrier: 'UPS',
          shippingMethod: 'Standard',
          shippingAddress: {
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
        },
      },
    ],
  };
}
