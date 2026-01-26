/**
 * VDP Connection Test Workflow Example
 *
 * Prerequisites:
 * 1. Navigate to the project root directory
 * 2. Build the project: npm run build
 * 3. Navigate to the API examples directory: cd apps/api-examples
 * 4. Set up environment variables in .env file (see .env.example)
 * 5. Run this example:
 *    - Using npm script: npm run api:test-connection
 *    - Or directly: npx tsx workflows/test-vdp-connection.ts
 *
 * This workflow demonstrates:
 * Testing connectivity to Visa Developer Platform (VDP) using the testVdpConnection method
 * This is a simple GET request to /vdp/helloworld without MLE encryption
 */

import { VicApiClient } from '@vic/api-client';
import { handleWorkflowError } from '../utils/api-helpers.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  console.log('=== VDP Connection Test ===\n');

  try {
    // Create API client instance (loads config from environment variables)
    console.log('Step 1: Creating VIC API Client...');
    const client = new VicApiClient();
    console.log('✓ Client created successfully\n');

    // Test VDP connection
    console.log('Step 2: Testing VDP connectivity...');
    const response = await client.testVdpConnection();

    console.log('✓ VDP connection successful!\n');
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    if (response.correlationId) {
      console.log('Correlation ID:', response.correlationId);
    }

    console.log('\n=== Connection test completed successfully ===');
  } catch (error) {
    handleWorkflowError(error, 'Connection test failed');
  }
}

// Run the workflow
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
