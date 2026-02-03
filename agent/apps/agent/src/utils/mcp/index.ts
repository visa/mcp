// MCP Client - re-export from package with aliases for backward compatibility
import type { VisaMcpClient } from "@vic/mcp-client";

export {
  VisaMcpClient as McpClient,
  createVisaMcpClient as createMcpClient,
} from "@vic/mcp-client";
export type { Tool } from "@vic/mcp-client";

// Export closeMcpClient helper for backward compatibility
export async function closeMcpClient(client: VisaMcpClient): Promise<void> {
  await client.close();
}

// Tool Registry
export { ToolRegistry, createToolRegistry } from "./toolRegistry.js";
