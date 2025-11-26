import { APP_INSTANCE_BASE, ASSURANCE_DATA_BASE, WorkflowContext } from '../../utils/constants.js';
import { generateTimestamp, buildMandate } from '../../utils/payload-helpers.js';

/**
 * Builds the complete update-purchase-instruction payload
 * @param instructionId - Instruction identifier from previous initiate call
 * @param consumerId - Consumer identifier
 * @param tokenId - Token reference ID (same as enrollmentReferenceId)
 * @param context - Workflow context containing shared correlation identifiers
 * @returns Complete update-purchase-instruction payload object
 */
export function buildUpdatePurchaseInstructionPayload(
  instructionId: string,
  consumerId: string,
  tokenId: string,
  context: WorkflowContext
): Record<string, unknown> {
  const verificationTimestamp = generateTimestamp();

  return {
    instructionId,
    clientReferenceId: context.clientReferenceId,
    appInstance: {
      ...APP_INSTANCE_BASE,
      clientDeviceId: context.clientDeviceId,
    },
    tokenId,
    assuranceData: [
      {
        ...ASSURANCE_DATA_BASE,
        verificationTimestamp,
      },
    ],
    mandates: [buildMandate()],
    consumerId,
    consumerPrompt: 'Purchase authorization mandate update',
  };
}
