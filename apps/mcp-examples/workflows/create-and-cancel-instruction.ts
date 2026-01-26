/**
 * Create and Cancel Instruction Workflow Example
 *
 * Prerequisites:
 * 1. Navigate to the project root directory
 * 2. Build the project: npm run build
 * 3. Navigate to the MCP examples directory: cd apps/mcp-examples
 * 4. Set up environment variables in .env file (see .env.example)
 * 5. Run this example:
 *    - Using npm script: npm run mcp:create-cancel
 *    - Or directly: npx tsx workflows/create-and-cancel-instruction.ts
 *
 * This workflow demonstrates:
 * MCP calls to enroll-card, initiate-purchase-instruction, and cancel-purchase-instruction tools
 */

import { enrollCard } from '../tools/enroll-card';
import { initiatePurchaseInstruction } from '../tools/initiate-purchase-instruction';
import { cancelPurchaseInstruction } from '../tools/cancel-purchase-instruction';
import { createWorkflowContext } from '@vic/shared-utils/constants';
import { runWorkflow } from '../utils/workflow-helpers.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  await runWorkflow('Create and Cancel Instruction', async (client) => {
    const context = createWorkflowContext();

    await enrollCard(client, context);
    const initiateResult = await initiatePurchaseInstruction(client, context);
    const instructionId = initiateResult.data.instructionId;
    await cancelPurchaseInstruction(client, {
      instructionId,
      context,
    });
  });
}

// Run the workflow
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
