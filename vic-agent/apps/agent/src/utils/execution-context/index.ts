/**
 * Execution Context Module
 * Provides a unified interface for executing Visa API operations
 * Supports both MCP server and direct API client modes
 */

export type { ExecutionContext, ExecutionResult } from "./types.js";
export { McpExecutionContext } from "./mcp-context.js";
export { ApiExecutionContext } from "./api-context.js";
export { createExecutionContext } from "./factory.js";
