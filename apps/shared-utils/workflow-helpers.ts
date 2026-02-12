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
