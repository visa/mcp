import { APP_INSTANCE_BASE, ASSURANCE_DATA_BASE, WorkflowContext } from '../../utils/constants.js';
import { generateTimestamp, buildMandate } from '../../utils/payload-helpers.js';

/**
 * Builds the complete initiate-purchase-instruction payload
 * @param consumerId - Consumer identifier
 * @param tokenId - Token reference ID (same as enrollmentReferenceId)
 * @param context - Workflow context containing shared correlation identifiers
 * @returns Complete initiate-purchase-instruction payload object
 */
export function buildInitiatePurchaseInstructionPayload(
  consumerId: string,
  tokenId: string,
  context: WorkflowContext
): Record<string, unknown> {
  const verificationTimestamp = generateTimestamp();

  return {
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
}
