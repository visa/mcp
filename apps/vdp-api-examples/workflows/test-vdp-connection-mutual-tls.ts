/**
 * VDP Connection Test Workflow Example — Two-Way SSL (Mutual TLS)
 *
 * Prerequisites:
 * 1. Navigate to the project root directory
 * 2. Build the project: npm run build
 * 3. Navigate to the VDP API examples directory: cd apps/vdp-api-examples
 * 4. Place your certificate files in the certs/ directory (see certs/README.md)
 * 5. Set up environment variables in .env file (see .env.example)
 * 6. Run this example:
 *    - Using npm script: npm run api:test-connection-mutual-tls
 *    - Or directly: npx tsx workflows/test-vdp-connection-mutual-tls.ts
 *
 * This workflow demonstrates:
 * Testing connectivity to Visa Developer Platform (VDP) using VdpMutualTlsClient
 * This is a simple GET request to /vdp/helloworld using Two-Way SSL
 * with client certificates and HTTP Basic Auth (via curl)
 */

import { VdpMutualTlsClient, type VicResponse } from '@visa/api-client';
import { handleWorkflowError } from '@visa/shared-utils/workflow-helpers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  console.log('=== VDP Connection Test (Two-Way SSL / Mutual TLS) ===\n');

  try {
    // Create API client instance (loads config from environment variables)
    console.log('Step 1: Creating VDP Mutual TLS Client...');
    const client = new VdpMutualTlsClient();
    console.log('✓ Client created successfully\n');

    // Test VDP connection via Two-Way SSL
    console.log('Step 2: Testing VDP connectivity via Two-Way SSL...');
    const response = await client.testVdpConnection<VicResponse>();

    console.log('✓ VDP connection successful!\n');
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    if (response.correlationId) {
      console.log('Correlation ID:', response.correlationId);
    }

    console.log('\n=== Connection test (Two-Way SSL) completed successfully ===');
  } catch (error) {
    handleWorkflowError(error, 'Connection test (Two-Way SSL) failed');
  }
}

// Run the workflow
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
