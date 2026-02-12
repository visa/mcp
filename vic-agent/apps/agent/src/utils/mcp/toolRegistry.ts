import { AIMessage, ToolMessage, BaseMessage } from "@langchain/core/messages";
import { randomUUID } from "crypto";
import type { Tool, VisaMcpClient as McpClient } from "@visa/mcp-client";
import { redactObject } from "./redaction.js";

/**
 * Creates AIMessage and ToolMessage for direct tool calls to display in UI
 * @internal
 */
function createToolCallMessages(
  toolName: string,
  args: Record<string, unknown>,
  result: unknown
): {
  aiMessage: AIMessage;
  toolMessage: ToolMessage;
  toolCallId: string;
} {
  // Generate unique IDs for messages and tool call
  const toolCallId = randomUUID();
  const aiMessageId = randomUUID();
  const toolMessageId = randomUUID();

  // Redact sensitive data in arguments
  const redactedArgs = redactObject(args as Record<string, any>);

  // Redact sensitive data in result
  let redactedResult: unknown;
  if (typeof result === "object" && result !== null) {
    redactedResult = redactObject(result as Record<string, any>);
  } else {
    redactedResult = result;
  }

  // Create AIMessage with tool_calls array (matches LLM-generated structure)
  const aiMessage = new AIMessage({
    id: aiMessageId,
    content: "",
    tool_calls: [
      {
        name: toolName,
        id: toolCallId,
        args: redactedArgs,
        type: "tool_call" as const,
      },
    ],
    additional_kwargs: {
      ui_only: true,
      direct_tool_call: true,
    },
  });

  // Create ToolMessage with redacted result
  const toolMessage = new ToolMessage({
    id: toolMessageId,
    content:
      typeof redactedResult === "string"
        ? redactedResult
        : JSON.stringify(redactedResult, null, 2),
    tool_call_id: toolCallId,
    name: toolName,
    additional_kwargs: {
      ui_only: true,
    },
  });

  return {
    aiMessage,
    toolMessage,
    toolCallId,
  };
}

/**
 * Tool Registry for MCP tools
 * Manages tool discovery and provides direct tool calling with UI message generation
 */
export class ToolRegistry {
  private mcpClient: McpClient;
  private allMcpTools: Tool[] | null = null;

  constructor(mcpClient: McpClient) {
    this.mcpClient = mcpClient;
  }

  /**
   * Lazy-loads all MCP tools from server
   * @internal
   */
  private async ensureToolsLoaded(): Promise<void> {
    if (this.allMcpTools === null) {
      this.allMcpTools = await this.mcpClient.listTools();
      console.log(`✓ Loaded ${this.allMcpTools.length} tools from MCP server`);
    }
  }

  /**
   * Calls a tool directly and returns both result and UI messages.
   * Use this in nodes to display tool calls in the UI with automatic
   * sensitive data redaction.
   *
   * @param toolName - Name of the tool to call
   * @param args - Arguments to pass to the tool
   * @returns Object with result and messages for UI display
   */
  async callToolDirectWithMessages<T = unknown>(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<{
    result: T;
    messages: BaseMessage[];
  }> {
    // Ensure tools are loaded (validates tool exists)
    await this.ensureToolsLoaded();

    const mcpTool = this.allMcpTools!.find((t) => t.name === toolName);
    if (!mcpTool) {
      throw new Error(
        `Tool '${toolName}' not found. Available tools: ${this.allMcpTools!.map((t) => t.name).join(", ")}`
      );
    }

    // Call the tool through MCP client
    const result = await this.mcpClient.callTool<T>(toolName, args);

    // Create UI messages with redaction
    const { aiMessage, toolMessage } = createToolCallMessages(
      toolName,
      args,
      result
    );

    return {
      result,
      messages: [aiMessage, toolMessage],
    };
  }
}

/**
 * Creates a ToolRegistry instance
 *
 * @param mcpClient - Connected McpClient instance
 * @returns ToolRegistry instance
 */
export async function createToolRegistry(
  mcpClient: McpClient
): Promise<ToolRegistry> {
  return new ToolRegistry(mcpClient);
}
