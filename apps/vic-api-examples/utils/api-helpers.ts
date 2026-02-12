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
