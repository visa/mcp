import { AIMessage, ToolMessage, BaseMessage } from "@langchain/core/messages";
import { randomUUID } from "crypto";
import { VtsApiClient, VicApiClient } from "@visa/api-client";
import type { ExecutionContext, ExecutionResult } from "./types.js";
import { redactObject } from "../mcp/redaction.js";
import { MCP_TOOLS } from "../constant.js";

/**
 * Builds client object from env vars (required for VIC API calls like enrollCard)
 * MCP server adds this automatically, but direct API calls need it explicitly
 */
function buildClientObject(): Record<string, unknown> {
  const client: Record<string, unknown> = {
    externalClientId: process.env.VISA_EXTERNAL_CLIENT_ID,
    externalAppId: process.env.VISA_EXTERNAL_APP_ID,
  };

  // Add optional fields if present
  if (process.env.VISA_AUTHORIZATION) {
    client.authorization = process.env.VISA_AUTHORIZATION;
  }
  if (process.env.VISA_RELATIONSHIP_ID) {
    client.relationshipId = process.env.VISA_RELATIONSHIP_ID;
  }

  return client;
}

/**
 * Creates AIMessage and ToolMessage for direct API calls to display in UI
 * Replicates the same structure as MCP tool calls for consistent UI display
 */
function createApiCallMessages(
  operationName: string,
  args: Record<string, unknown>,
  result: unknown
): BaseMessage[] {
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
        name: operationName,
        id: toolCallId,
        args: redactedArgs,
        type: "tool_call" as const,
      },
    ],
    additional_kwargs: {
      ui_only: true,
      direct_api_call: true,
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
    name: operationName,
    additional_kwargs: {
      ui_only: true,
    },
  });

  return [aiMessage, toolMessage];
}

/**
 * API-based execution context
 * Uses VtsApiClient and VicApiClient for direct API calls
 */
export class ApiExecutionContext implements ExecutionContext {
  private vtsClient: VtsApiClient;
  private vicClient: VicApiClient;

  constructor() {
    this.vtsClient = new VtsApiClient();
    this.vicClient = new VicApiClient();
  }

  async provisionTokenGivenPanData(
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const result = await this.vtsClient.provisionTokenGivenPanData(payload);
    const messages = createApiCallMessages(
      MCP_TOOLS.PROVISION_TOKEN_GIVEN_PAN_DATA,
      payload,
      result
    );
    return { result, messages };
  }

  async deviceBindingRequest(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const fullPayload = { vProvisionedTokenID: tokenId, ...payload };
    // Strip fields that go elsewhere:
    // - vProvisionedTokenID goes in URL path
    // - reasonCode goes in URL query params (not body)
    // - clientReferenceId needs to be renamed to clientReferenceID for VTS API
    const {
      vProvisionedTokenID,
      reasonCode,
      clientReferenceId,
      ...restPayload
    } = payload;

    // Build API payload with correct field name (VTS uses uppercase ID)
    const apiPayload: Record<string, unknown> = {
      ...restPayload,
    };
    if (clientReferenceId !== undefined) {
      apiPayload.clientReferenceID = clientReferenceId;
    }

    const result = await this.vtsClient.deviceBindingRequest(
      tokenId,
      apiPayload,
      (reasonCode as string) || "PROVISIONING"
    );

    // Extract data from wrapped response to match MCP server format
    // MCP server's device-binding-request returns unwrapped { status, stepUpRequest }
    const unwrappedResult = (result as { data: unknown }).data;

    const messages = createApiCallMessages(
      MCP_TOOLS.DEVICE_BINDING_REQUEST,
      fullPayload,
      result // Keep full result in messages for debugging
    );
    return { result: unwrappedResult, messages };
  }

  async submitIdvStepUpMethod(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const fullPayload = { vProvisionedTokenID: tokenId, ...payload };
    // Strip vProvisionedTokenID from payload - it goes in URL path, not body
    const { vProvisionedTokenID, ...apiPayload } = payload;
    const result = await this.vtsClient.submitIdvStepUpMethod(
      tokenId,
      apiPayload
    );
    const messages = createApiCallMessages(
      MCP_TOOLS.SUBMIT_IDV_STEP_UP_METHOD,
      fullPayload,
      result
    );
    return { result, messages };
  }

  async validateOtp(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const fullPayload = { vProvisionedTokenID: tokenId, ...payload };
    // Strip vProvisionedTokenID from payload - it goes in URL path, not body
    const { vProvisionedTokenID, ...apiPayload } = payload;
    const result = await this.vtsClient.validateOtp(tokenId, apiPayload);
    const messages = createApiCallMessages(
      MCP_TOOLS.VALIDATE_OTP,
      fullPayload,
      result
    );
    return { result, messages };
  }

  async getTokenStatus(tokenId: string): Promise<ExecutionResult> {
    const payload = { vProvisionedTokenID: tokenId };
    const result = await this.vtsClient.getTokenStatus(tokenId);
    const messages = createApiCallMessages(
      MCP_TOOLS.GET_TOKEN_STATUS,
      payload,
      result
    );
    return { result, messages };
  }

  async deleteToken(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const fullPayload = { vProvisionedTokenID: tokenId, ...payload };
    // Strip vProvisionedTokenID from payload - it goes in URL path, not body
    const { vProvisionedTokenID, ...apiPayload } = payload;
    const result = await this.vtsClient.deleteToken(tokenId, apiPayload);
    const messages = createApiCallMessages(
      MCP_TOOLS.DELETE_TOKEN,
      fullPayload,
      result
    );
    return { result, messages };
  }

  async getDeviceAttestationOptions(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult> {
    const fullPayload = { vProvisionedTokenID: tokenId, ...payload };
    // Strip vProvisionedTokenID from payload - it goes in URL path, not body
    const { vProvisionedTokenID, ...apiPayload } = payload;
    const result = await this.vtsClient.getDeviceAttestationOptions(
      tokenId,
      apiPayload
    );
    const messages = createApiCallMessages(
      MCP_TOOLS.GET_DEVICE_ATTESTATION_OPTIONS,
      fullPayload,
      result
    );
    return { result, messages };
  }

  async enrollCard(payload: Record<string, unknown>): Promise<ExecutionResult> {
    // Enrich payload with client object (MCP server adds this automatically)
    const enrichedPayload = {
      ...payload,
      client: buildClientObject(),
    };
    const result = await this.vicClient.enrollCard(enrichedPayload);
    const messages = createApiCallMessages(
      MCP_TOOLS.ENROLL_CARD,
      enrichedPayload,
      result
    );
    return { result, messages };
  }
}
