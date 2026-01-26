/**
 * Retrieve Payment Credentials and Confirm Transaction Events Workflow Example
 *
 * Prerequisites:
 * 1. Navigate to the project root directory
 * 2. Build the project: npm run build
 * 3. Navigate to the MCP examples directory: cd apps/mcp-examples
 * 4. Set up environment variables in .env file (see .env.example)
 * 5. Run this example:
 *    - Using npm script: npm run mcp:retrieve-confirm
 *    - Or directly: npx tsx workflows/retrieve-credentials-confirmations.ts
 *
 * This workflow demonstrates:
 * MCP calls to enroll-card, initiate-purchase-instruction, retrieve-payment-credentials, and confirm-transaction-events tools
 */

import { enrollCard } from '../tools/enroll-card';
import { initiatePurchaseInstruction } from '../tools/initiate-purchase-instruction';
import { retrievePaymentCredentials } from '../tools/retrieve-payment-credentials';
import { confirmTransactionEvents } from '../tools/confirm-transaction-events';
import { createWorkflowContext } from '@vic/shared-utils/constants';
import { runWorkflow } from '../utils/workflow-helpers.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  await runWorkflow(
    'Retrieve Payment Credentials and Confirm Transaction Events',
    async (client) => {
      // Create workflow context once for correlation across all tools in this workflow
      const context = createWorkflowContext();

      await enrollCard(client, context);
      const initiateResult = await initiatePurchaseInstruction(client, context);
      const instructionId = initiateResult.data.instructionId;

      const transactionReferenceId = crypto.randomUUID();

      await retrievePaymentCredentials(client, {
        instructionId,
        transactionReferenceId,
        context,
      });
      await confirmTransactionEvents(client, {
        instructionId,
        transactionReferenceId,
        context,
      });
    }
  );
}

// Run the workflow
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
