import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Builds client object from environment variables for API requests
 * Required for enrollCard, initiate/update instructions, getTransactionCredentials
 */
export function buildClientObject(): Record<string, unknown> {
  const externalClientId = process.env.VISA_EXTERNAL_CLIENT_ID;
  const externalAppId = process.env.VISA_EXTERNAL_APP_ID;

  if (!externalClientId || !externalAppId) {
    throw new Error(
      'Missing required environment variables: VISA_EXTERNAL_CLIENT_ID and VISA_EXTERNAL_APP_ID'
    );
  }

  const client: Record<string, unknown> = {
    externalClientId,
    externalAppId,
  };

  // Add optional fields if present
  const authorization = process.env.VISA_AUTHORIZATION;
  const relationshipId = process.env.VISA_RELATIONSHIP_ID;

  if (authorization) {
    client.authorization = authorization;
  }
  if (relationshipId) {
    client.relationshipId = relationshipId;
  }

  return client;
}

/**
 * Handles and logs workflow errors with detailed information
 * Checks for VicApiError properties (correlationId, status) and logs them
 * @param error - The error to handle
 * @param contextMessage - Custom message to prefix the error log (e.g., "Connection test failed")
 */
export function handleWorkflowError(error: unknown, contextMessage: string): void {
  console.error(`\n❌ ${contextMessage}:`, error);

  if (error instanceof Error) {
    console.error('   Error message:', error.message);

    // Check if this is a VicApiError with additional details
    if ('correlationId' in error) {
      console.error('   Correlation ID:', (error as { correlationId?: string }).correlationId);
    }
    if ('status' in error) {
      console.error('   HTTP Status:', (error as { status?: number }).status);
    }
    if (error.stack) {
      console.error('   Stack trace:', error.stack);
    }
  }

  process.exit(1);
}
