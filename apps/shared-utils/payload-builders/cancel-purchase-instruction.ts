import {
  APP_INSTANCE_BASE,
  ASSURANCE_DATA_BASE,
  type WorkflowContext,
} from '../constants.js';
import { generateTimestamp } from '../payload-helpers.js';

/**
 * Builds the complete cancel-purchase-instruction payload
 *
 * @param context - Workflow context containing shared correlation identifiers
 * @param instructionId - Optional instruction identifier (included in payload only if provided)
 * @param client - Optional client object (included in payload only if provided)
 * @returns Complete cancel-purchase-instruction payload object
 */
export function buildCancelPurchaseInstructionPayload(
  context: WorkflowContext,
  instructionId?: string,
  client?: Record<string, unknown>
): Record<string, unknown> {
  const verificationTimestamp = generateTimestamp();

  const payload: Record<string, unknown> = {
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

  if (instructionId) {
    payload.instructionId = instructionId;
  }

  if (client) {
    payload.client = client;
  }

  return payload;
}