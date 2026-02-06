import type { ExecutionContext } from "./types.js";
import type { ToolRegistry } from "../mcp/index.js";
import { McpExecutionContext } from "./mcp-context.js";
import { ApiExecutionContext } from "./api-context.js";

/**
 * Creates an ExecutionContext based on the useDirectApi flag
 *
 * @param useDirectApi - If true, uses direct API calls; if false, uses MCP server
 * @param toolRegistry - Required when useDirectApi is false
 * @returns ExecutionContext implementation
 * @throws Error if MCP mode requested but toolRegistry not provided
 */
export function createExecutionContext(
  useDirectApi: boolean,
  toolRegistry?: ToolRegistry
): ExecutionContext {
  if (useDirectApi) {
    console.log("✓ Creating API execution context (direct API calls)");
    return new ApiExecutionContext();
  }

  if (!toolRegistry) {
    throw new Error(
      "ToolRegistry is required when useDirectApi is false (MCP mode)"
    );
  }

  console.log("✓ Creating MCP execution context (via MCP server)");
  return new McpExecutionContext(toolRegistry);
}
