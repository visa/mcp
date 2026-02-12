import { createVisaMcpClient, type VisaMcpClient } from '@visa/mcp-client';

/**
 * Runs a workflow with automatic client lifecycle management, cleanup, and signal handling
 *
 * This helper function eliminates boilerplate code by handling:
 * - Client creation and connection
 * - Graceful shutdown on SIGINT/SIGTERM
 * - Automatic cleanup and connection closing
 * - Error handling and reporting
 *
 * @param workflowName - Name of the workflow for logging purposes
 * @param workflowFn - Async function containing the workflow logic, receives connected client
 * @throws Error if workflow fails or connection cannot be established
 *
 * @example
 * ```typescript
 * await runWorkflow('My Workflow', async (client) => {
 *   const context = createWorkflowContext();
 *   await enrollCard(client, context);
 *   // ... more workflow steps
 * });
 * ```
 */
export async function runWorkflow(
  workflowName: string,
  workflowFn: (client: VisaMcpClient) => Promise<void>
): Promise<void> {
  console.log(`=== ${workflowName} Workflow ===\n`);

  let client: VisaMcpClient | null = null;

  // Setup graceful shutdown
  const cleanup = async (): Promise<void> => {
    if (client) {
      console.log('\n🧹 Cleaning up...');
      await client.close();
      console.log('✓ Connection closed');
    }
  };

  // Handle signals
  const handleShutdown = (signal: string): void => {
    console.log(`\n\nReceived ${signal}, shutting down gracefully...`);
    cleanup()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Error during cleanup:', error);
        process.exit(1);
      });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  try {
    // Connect to MCP server
    console.log(' 🔌 Connecting to Visa MCP server...');
    client = await createVisaMcpClient();
    console.log(' ✅ Connected successfully\n');

    // Execute workflow logic
    await workflowFn(client);

    console.log('\n=== Workflow completed successfully ===');
  } catch (error) {
    console.error('\n  ❌ Workflow failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      if (error.stack) {
        console.error('   Stack trace:', error.stack);
      }
    }
    process.exit(1);
  } finally {
    await cleanup();
  }
}
