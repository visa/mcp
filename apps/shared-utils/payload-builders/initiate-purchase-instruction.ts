import { APP_INSTANCE_BASE, ASSURANCE_DATA_BASE, WorkflowContext } from '../constants.js';
import { generateTimestamp, buildMandate } from '../payload-helpers.js';

/**
 * Builds the complete initiate-purchase-instruction payload
 * @param consumerId - Consumer identifier
 * @param tokenId - Token reference ID (same as enrollmentReferenceId)
 * @param context - Workflow context containing shared correlation identifiers
 * @param client - Optional client object (included in payload only if provided)
 * @returns Complete initiate-purchase-instruction payload object
 */
export function buildInitiatePurchaseInstructionPayload(
    consumerId: string,
    tokenId: string,
    context: WorkflowContext,
    client?: Record<string, unknown>
): Record<string, unknown> {
  const verificationTimestamp = generateTimestamp();

  const payload: Record<string, unknown> = {
    clientReferenceId: context.clientReferenceId,
    appInstance: {
      ...APP_INSTANCE_BASE,
      clientDeviceId: context.clientDeviceId,
    },
    consumerId,
    tokenId,
    assuranceData: [
      {
        ...ASSURANCE_DATA_BASE,
        verificationTimestamp,
      },
    ],
    mandates: [buildMandate()],
    consumerPrompt: 'Purchase authorization mandate',
  };

  if (client) {
    payload.client = client;
  }

  return payload;
}