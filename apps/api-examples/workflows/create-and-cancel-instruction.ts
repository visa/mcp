/**
 * Create and Cancel Instruction Workflow Example - Direct API Approach
 *
 * Prerequisites:
 * 1. Navigate to the project root directory
 * 2. Build the project: npm run build
 * 3. Navigate to the API examples directory: cd apps/api-examples
 * 4. Set up environment variables in .env file (see .env.example)
 * 5. Run this example:
 *    - Using npm script: npm run api:create-cancel
 *    - Or directly: npx tsx workflows/create-and-cancel-instruction.ts
 *
 * This workflow demonstrates:
 * Direct REST API calls using VicApiClient to enroll-card, initiate-purchase-instruction, and cancel-purchase-instruction
 */

import { VicApiClient } from '@vic/api-client';
import { createWorkflowContext } from '@vic/shared-utils/constants';
import { enrollCard } from '../tools/enroll-card.js';
import { initiatePurchaseInstruction } from '../tools/initiate-purchase-instruction.js';
import { cancelPurchaseInstruction } from '../tools/cancel-purchase-instruction.js';
import { handleWorkflowError } from '../utils/api-helpers.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  console.log('=== Create and Cancel Instruction Workflow (API) ===\n');

  try {
    // Create API client instance (loads config from environment variables)
    const client = new VicApiClient();

    // Create workflow context with unique UUIDs for correlation
    const context = createWorkflowContext();

    // Step 1: Enroll Card
    await enrollCard(client, context);

    // Step 2: Initiate Purchase Instruction
    const initiateResult = await initiatePurchaseInstruction(client, context);
    const instructionId = initiateResult.data.instructionId;

    // Step 3: Cancel Purchase Instruction
    await cancelPurchaseInstruction(client, {
      instructionId,
      context,
    });

    console.log('\n=== Workflow completed successfully ===');
  } catch (error) {
    handleWorkflowError(error, 'Workflow failed');
  }
}

// Run the workflow
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
