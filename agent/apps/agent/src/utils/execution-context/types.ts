import type { BaseMessage } from "@langchain/core/messages";

/**
 * Result of executing a Visa API operation
 */
export interface ExecutionResult<T = any> {
  /** The API response data */
  result: T;
  /** Messages for UI display (AIMessage with tool_calls + ToolMessage with result) */
  messages: BaseMessage[];
}

/**
 * Unified interface for executing Visa API operations
 * Implementations can use either MCP client or direct API client
 */
export interface ExecutionContext {
  /**
   * Provisions a token given PAN data
   * VTS: POST /vts/provisionedTokens
   */
  provisionTokenGivenPanData(
    payload: Record<string, unknown>
  ): Promise<ExecutionResult>;

  /**
   * Initiates device binding request
   * VTS: POST /vts/provisionedTokens/{tokenId}/deviceBinding
   */
  deviceBindingRequest(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult>;

  /**
   * Submits ID&V step-up method choice
   * VTS: PUT /vts/provisionedTokens/{tokenId}/stepUpOptions/method
   */
  submitIdvStepUpMethod(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult>;

  /**
   * Validates OTP
   * VTS: POST /vts/provisionedTokens/{tokenId}/stepUpOptions/validateOTP
   */
  validateOtp(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult>;

  /**
   * Gets token status
   * VTS: GET /vts/provisionedTokens/{tokenId}
   */
  getTokenStatus(tokenId: string): Promise<ExecutionResult>;

  /**
   * Deletes a token
   * VTS: PUT /vts/provisionedTokens/{tokenId}/delete
   */
  deleteToken(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult>;

  /**
   * Gets device attestation options
   * VTS: POST /vts/provisionedTokens/{tokenId}/attestation/options
   */
  getDeviceAttestationOptions(
    tokenId: string,
    payload: Record<string, unknown>
  ): Promise<ExecutionResult>;

  /**
   * Enrolls a card in VIC platform
   * VIC: POST /vacp/v1/cards
   */
  enrollCard(payload: Record<string, unknown>): Promise<ExecutionResult>;
}
