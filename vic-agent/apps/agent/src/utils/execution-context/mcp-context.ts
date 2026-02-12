import type { ExecutionContext, ExecutionResult } from "./types.js";
import type { ToolRegistry } from "../mcp/index.js";
import { MCP_TOOLS } from "../constant.js";

/**
 * MCP-based execution context
 * Uses ToolRegistry to call tools via MCP server
 */
export class McpExecutionContext implements ExecutionContext {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  async provisionTokenGivenPanData(
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const { result, messages } = await this.registry.callToolDirectWithMessages(
      MCP_TOOLS.PROVISION_TOKEN_GIVEN_PAN_DATA,
      payload
    );
    return { result, messages };
  }

  async deviceBindingRequest(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const { result, messages } = await this.registry.callToolDirectWithMessages(
      MCP_TOOLS.DEVICE_BINDING_REQUEST,
      { vProvisionedTokenID: tokenId, ...payload }
    );
    return { result, messages };
  }

  async submitIdvStepUpMethod(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const { result, messages } = await this.registry.callToolDirectWithMessages(
      MCP_TOOLS.SUBMIT_IDV_STEP_UP_METHOD,
      { vProvisionedTokenID: tokenId, ...payload }
    );
    return { result, messages };
  }

  async validateOtp(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const { result, messages } = await this.registry.callToolDirectWithMessages(
      MCP_TOOLS.VALIDATE_OTP,
      { vProvisionedTokenID: tokenId, ...payload }
    );
    return { result, messages };
  }

  async getTokenStatus(tokenId: string): Promise<ExecutionResult> {
    const { result, messages } = await this.registry.callToolDirectWithMessages(
      MCP_TOOLS.GET_TOKEN_STATUS,
      { vProvisionedTokenID: tokenId }
    );
    return { result, messages };
  }

  async deleteToken(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const { result, messages } = await this.registry.callToolDirectWithMessages(
      MCP_TOOLS.DELETE_TOKEN,
      { vProvisionedTokenID: tokenId, ...payload }
    );
    return { result, messages };
  }

  async getDeviceAttestationOptions(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const { result, messages } = await this.registry.callToolDirectWithMessages(
      MCP_TOOLS.GET_DEVICE_ATTESTATION_OPTIONS,
      { vProvisionedTokenID: tokenId, ...payload }
    );
    return { result, messages };
  }

  async enrollCard(payload: Record<string, unknown>): Promise<ExecutionResult> {
    const { result, messages } = await this.registry.callToolDirectWithMessages(
      MCP_TOOLS.ENROLL_CARD,
      payload
    );
    return { result, messages };
  }
}
