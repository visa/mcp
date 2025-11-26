import type { VisaMcpClient } from '../../../src/mcp-client.js';
import { buildEnrollCardPayload } from './payload-builder.js';
import type { WorkflowContext } from '../../utils/constants.js';

/**
 * Response structure from enroll-card tool
 */
export interface EnrollCardResponse {
  data: {
    clientReferenceId: string;
    status: string;
    pendingEvents?: string[];
  };
  correlationId: string;
}

/**
 * Calls the enroll-card MCP tool with constructed payload
 *
 * @param client - Connected VisaMcpClient instance
 * @param context - Workflow context containing shared correlation identifiers
 * @returns Complete response from enroll-card tool including clientReferenceId, status, correlationId, and optional pendingEvents
 * @throws Error if tool call fails or required environment variables are missing
 */
export async function enrollCard(
  client: VisaMcpClient,
  context: WorkflowContext
): Promise<EnrollCardResponse> {
  console.log('\n📋 Step: Enrolling card...');

  // Read configuration from environment variables
  const consumerId = process.env.VISA_CONSUMER_ID;
  const enrollmentReferenceId = process.env.VISA_ENROLLMENT_REFERENCE_ID;

  // Validate required environment variables
  if (!consumerId || !enrollmentReferenceId) {
    throw new Error(
      'Missing required environment variables. Please ensure VISA_CONSUMER_ID and ' +
        'VISA_ENROLLMENT_REFERENCE_ID are set in your .env file.'
    );
  }

  // Build the payload using configuration and utilities
  const payload = buildEnrollCardPayload(consumerId, enrollmentReferenceId, context);

  const response = await client.callTool<EnrollCardResponse>('enroll-card', payload);

  console.log(' ✅ Card enrolled successfully');
  console.log(JSON.stringify(response, null, 2));

  return response;
}
