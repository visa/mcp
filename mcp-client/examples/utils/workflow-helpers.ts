import { createVisaMcpClient, type VisaMcpClient } from '../../src/mcp-client.js';
import { createChildLogger } from '../../src/utils/logger.js';

const logger = createChildLogger({ component: 'WorkflowHelper' });

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
  logger.info(`=== ${workflowName} Workflow ===\n`);

  let client: VisaMcpClient | null = null;

  // Setup graceful shutdown
  const cleanup = async (): Promise<void> => {
    if (client) {
      logger.info('Cleaning up...');
      await client.close();
      logger.info('Connection closed');
    }
  };

  // Handle signals
  const handleShutdown = (signal: string): void => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    cleanup()
      .then(() => process.exit(0))
      .catch((error) => {
        logger.error({ error }, 'Error during cleanup');
        process.exit(1);
      });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  try {
    // Connect to MCP server
    logger.info('Connecting to Visa MCP server...');
    client = await createVisaMcpClient();
    logger.info('Connected successfully\n');

    // Execute workflow logic
    await workflowFn(client);

    logger.info('Workflow completed successfully');
  } catch (error) {
    logger.error({ error }, 'Workflow failed');
    if (error instanceof Error) {
      logger.error({ message: error.message, stack: error.stack }, 'Error details');
    }
    process.exit(1);
  } finally {
    await cleanup();
  }
}
