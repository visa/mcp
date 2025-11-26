import {
  APP_INSTANCE_BASE,
  ASSURANCE_DATA_BASE,
  type WorkflowContext,
} from '../../utils/constants.js';
import { generateTimestamp } from '../../utils/payload-helpers.js';

/**
 * Builds the complete cancel-purchase-instruction payload
 *
 * @param instructionId - Instruction identifier from previous initiate call
 * @param context - Workflow context containing shared correlation identifiers
 * @returns Complete cancel-purchase-instruction payload object
 */
export function buildCancelPurchaseInstructionPayload(
  instructionId: string,
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
    assuranceData: [
      {
        ...ASSURANCE_DATA_BASE,
        verificationTimestamp,
      },
    ],
  };
}
