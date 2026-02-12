/**
 * Mode values for tracking active subgraph during execution.
 * Used for interrupt resumption and routing logic.
 */
export const MODE = {
  ADD_CARD: "add-card",
  USER_INTENT: "user-intent",
  DELETE_CARD: "delete-card",
} as const;

/**
 * Action values for one-time operations triggered from UI.
 * Actions have higher priority than modes in routing logic.
 */
export const ACTION = {
  DELETE_CARD: "delete-card",
} as const;

/**
 * Node names used in the graph workflow.
 * Centralizing these constants makes refactoring easier and prevents typos.
 */
export const NODE_NAMES = {
  // Router
  ROUTER: "router",

  // User Intent nodes
  CLARIFY_INTENT: "clarify_intent",
  EXPECT_USER_INTENT: "expect_user_intent",
  CLEAR_USER_INTENT_MODE: "clear_user_intent_mode",

  // Add Card nodes
  EXPECT_CARD_DATA: "expect_card_data",
  TOKENIZE_CARD: "tokenize_card",
  EXPECT_VTS_SECURE_TOKEN: "expect_vts_secure_token",
  GET_DEVICE_ATTESTATION_OPTIONS: "get_device_attestation_options",
  DEVICE_BINDING: "device_binding",
  EXPECT_VALIDATION_METHOD: "expect_validation_method",
  CREATE_CHALLENGE: "create_challenge",
  EXPECT_OTP: "expect_otp",
  VALIDATE_OTP: "validate_otp",
  CHECK_TOKEN_STATUS: "check_token_status",
  REGISTER_ATTESTATION_OPTIONS: "register_attestation_options",
  AUTHENTICATE_ATTESTATION_OPTIONS: "authenticate_attestation_options",
  EXPECT_AUTHENTICATE_MESSAGE_RESULT: "expect_authenticate_message_result",
  ENROLL_CARD: "enroll_card",
  CLEAR_ADD_CARD_MODE: "clear_add_card_mode",

  // Delete Card nodes
  DELETE_TOKEN: "delete_token",
  SIGNAL_UI_CARD_DELETED: "signal_ui_card_deleted",
  CLEAR_DELETE_CARD_ACTION: "clear_delete_card_action",
} as const;

/**
 * MCP Tool Names
 * Centralized constants for MCP tool names to prevent typos and improve maintainability
 */
export const MCP_TOOLS = {
  /**
   * Visa Token Requestor - Provision token given PAN data
   * Tokenizes card data for secure payment processing
   */
  PROVISION_TOKEN_GIVEN_PAN_DATA: "provision-token-given-pan-data",
  /**
   * VTS - Get device attestation options
   * Retrieves device attestation options for FIDO authentication
   */
  GET_DEVICE_ATTESTATION_OPTIONS: "get-device-attestation-options",
  /**
   * VTS - Device binding request
   * Initiates device binding for FIDO authentication
   */
  DEVICE_BINDING_REQUEST: "device-binding-request",
  /**
   * VTS - Submit IDV step-up method
   * Submits the selected validation method for step-up authentication
   */
  SUBMIT_IDV_STEP_UP_METHOD: "submit-idv-step-up-method",
  /**
   * VTS - Validate OTP
   * Validates the one-time password for step-up authentication
   */
  VALIDATE_OTP: "validate-otp",
  /**
   * VTS - Get Token Status
   * Retrieves the current status of the provisioned token
   */
  GET_TOKEN_STATUS: "get-token-status",
  /**
   * VTS - Delete Token
   * Deletes a provisioned token from the Visa Token Service
   */
  DELETE_TOKEN: "delete-token",
  /**
   * VIC - Enroll Card
   * Enrolls a card in the VIC platform
   */
  ENROLL_CARD: "enroll-card",
} as const;
