import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { MODE } from "./constant.js";

/**
 * Step-up request item structure for device binding validation.
 */
export type StepUpRequestItem = {
  method?:
    | "OTPEMAIL"
    | "OTPONLINEBANKING"
    | "OTPSMS"
    | "CUSTOMERSERVICE"
    | "APP-TO-APP"
    | "OUTBOUNDCALL";
  value?: string;
  identifier?: string;
};

/**
 * Shared messages channel - created once and reused in both state schemas.
 * This ensures LangGraph sees the same channel instance in both GraphState and OutputStateAnnotation.
 */
const messagesChannel = Annotation<BaseMessage[]>({
  reducer: (x, y) => x.concat(y),
});

/**
 * Shared isMcpConnected channel - created once and reused in both state schemas.
 * This ensures LangGraph sees the same channel instance in both GraphState and OutputStateAnnotation.
 */
const isMcpConnectedChannel = Annotation<boolean>({
  reducer: (x, y) => (y !== undefined ? y : x),
  default: () => false,
});

/**
 * Shared registerAttestationOptions channel - created once and reused in both state schemas.
 * This ensures LangGraph sees the same channel instance in both GraphState and OutputStateAnnotation.
 */
const registerAttestationOptionsChannel = Annotation<{
  data?: {
    ignore00field?: string;
    authenticationContext?: {
      endpoint?: string;
      identifier?: string;
      payload?: string;
      action?: string;
      platformType?: string;
      authenticationPreferencesEnabled?: {
        responseMode?: string;
        responseType?: string;
      };
    };
  };
  correlationId?: string;
} | null>({
  reducer: (x, y) => (y !== undefined ? y : x),
  default: () => null,
});

/**
 * Shared validationMethods channel - created once and reused in both state schemas.
 * This ensures LangGraph sees the same channel instance in both GraphState and OutputStateAnnotation.
 */
const validationMethodsChannel = Annotation<Array<{
  method: string;
  value: string;
}> | null>({
  reducer: (x, y) => (y !== undefined ? y : x),
  default: () => null,
});

/**
 * Shared tokenId channel - created once and reused in both state schemas.
 * This ensures LangGraph sees the same channel instance in both GraphState and OutputStateAnnotation.
 * Contains the provisioned token ID from Visa tokenization, exposed to UI for storage and reuse.
 */
const tokenIdChannel = Annotation<string | null>({
  reducer: (x, y) => (y !== undefined ? y : x),
  default: () => null,
});

/**
 * Shared action channel - created once and reused in both state schemas.
 * Public action field for one-time operations triggered from UI (e.g., "delete-card").
 * This ensures LangGraph sees the same channel instance in both GraphState and OutputStateAnnotation.
 */
const actionChannel = Annotation<string | null>({
  reducer: (x, y) => (y !== undefined ? y : x),
  default: () => null,
});

/**
 * Shared cardDeletionSignal channel - created once and reused in both state schemas.
 * Counter that increments when a card is deleted, signaling UI to clear localStorage.
 * UI watches for value changes (0 -> 1 -> 2, etc.) to trigger clearing.
 * This ensures LangGraph sees the same channel instance in both GraphState and OutputStateAnnotation.
 */
const cardDeletionSignalChannel = Annotation<number>({
  reducer: (x, y) => (y !== undefined ? y : x),
  default: () => 0,
});

/**
 * Success response from submit-idv-step-up-method API
 */
export type CreateChallengeSuccessResponse = {
  maxOTPRequestsAllowed?: number;
  maxOTPVerificationAllowed?: number;
  codeExpiration?: number;
};

/**
 * Error response from submit-idv-step-up-method API
 */
export type CreateChallengeErrorResponse = {
  errorResponse: {
    status: number;
    reason: string;
    message: string;
    ref: string | null;
  };
};

/**
 * Combined response type for create challenge
 */
export type CreateChallengeResponse =
  | CreateChallengeSuccessResponse
  | CreateChallengeErrorResponse;

/**
 * Type guard to check if response is an error
 */
export function isCreateChallengeError(
  response: CreateChallengeResponse | null
): response is CreateChallengeErrorResponse {
  return response !== null && "errorResponse" in response;
}

/**
 * Success response from validate-otp API
 * API returns 200 status with empty response body on success
 */
export type ValidateOtpSuccessResponse = Record<string, never>;

/**
 * Error response from validate-otp API
 */
export type ValidateOtpErrorResponse = {
  errorResponse: {
    status: number;
    reason: string;
    message: string;
    ref: string | null;
  };
};

/**
 * Combined response type for validate OTP
 */
export type ValidateOtpResponse =
  | ValidateOtpSuccessResponse
  | ValidateOtpErrorResponse;

/**
 * Type guard to check if response is an error
 */
export function isValidateOtpError(
  response: ValidateOtpResponse | null
): response is ValidateOtpErrorResponse {
  return response !== null && "errorResponse" in response;
}

/**
 * Success response from get-token-status API
 */
export type CheckTokenStatusSuccessResponse = {
  data?: {
    ignore00field?: string;
    tokenInfo?: {
      tokenStatus?: "INACTIVE" | "ACTIVE" | "SUSPENDED" | "DELETED";
      expirationDate?: {
        year?: string;
        month?: string;
      };
      ignore01field?: string;
    };
  };
  correlationId?: string;
};

/**
 * Error response from get-token-status API
 */
export type CheckTokenStatusErrorResponse = {
  errorResponse: {
    status: number;
    reason: string;
    message: string;
    ref: string | null;
  };
};

/**
 * Combined response type for check token status
 */
export type CheckTokenStatusResponse =
  | CheckTokenStatusSuccessResponse
  | CheckTokenStatusErrorResponse;

/**
 * Type guard to check if response is an error
 */
export function isCheckTokenStatusError(
  response: CheckTokenStatusResponse | null
): response is CheckTokenStatusErrorResponse {
  return response !== null && "errorResponse" in response;
}

/**
 * Internal graph state with both public and private fields.
 * Private fields (prefixed with private_) are never exposed to external clients.
 */
export const GraphState = Annotation.Root({
  /**
   * Messages in the conversation.
   * The reducer concatenates new messages to the existing list.
   */
  messages: messagesChannel,

  /**
   * Product name the user wants to buy.
   * Extracted by the intent clarification node.
   */
  product: Annotation<string | null>({
    reducer: (x, y) => (y !== undefined ? y : x), // Use new value if provided, otherwise keep existing
    default: () => null,
  }),

  /**
   * Budget amount in dollars.
   * Extracted by the intent clarification node.
   */
  budget: Annotation<number | null>({
    reducer: (x, y) => (y !== undefined ? y : x), // Use new value if provided, otherwise keep existing
    default: () => null,
  }),

  /**
   * Private field: Credit card data for payment processing.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_cardData: Annotation<{
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
  } | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * User email address.
   * Collected alongside card information for payment processing.
   */
  email: Annotation<string | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Provisioned token ID from Visa tokenization.
   * Uses shared channel to automatically sync with UI via OutputStateAnnotation.
   */
  private_tokenId: tokenIdChannel,

  /**
   * Private field: VTS authentication session data.
   * Contains authentication details from Visa Token Service.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_vtsAuthenticationSessionData: Annotation<{
    result?: string;
    browserData?: {
      browserJavaEnabled?: boolean;
      browserJavascriptEnabled?: boolean;
      browserLanguage?: string;
      browserColorDepth?: string;
      browserScreenHeight?: string;
      browserScreenWidth?: string;
      browserTimeZone?: string;
      userAgent?: string;
      browserHeader?: string;
      ipAddress?: string;
    };
    authenticationPreferencesSupported?: {
      requiresPopupForAuthenticate?: boolean;
      requiresPopupForRegister?: boolean;
    };
    sessionContext?: {
      secureToken?: string;
    };
    dfpSessionID?: string;
    requestID?: string;
    type?: string;
    version?: string;
  } | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: VTS authentication retry counter.
   * Tracks the number of VTS authentication attempts.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_vtsRetryCount: Annotation<number>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => 0,
  }),

  /**
   * Client reference ID for VTS operations.
   * Generated in UI and sent with VTS authentication data, persisted across session.
   */
  clientReferenceId: Annotation<string | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: VTS Client Device ID.
   * Generated in UI and sent with initial message for device identification.
   * Stored for potential future use in VTS operations.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_vtsClientDeviceId: Annotation<string | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: Device attestation options for tokenize flow.
   * Contains the response from get-device-attestation-options API call.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_deviceAttestationOptions: Annotation<{
    data?: {
      ignore00field?: string;
      authenticationContext?: {
        action?: string;
        identifier?: string;
        payload?: string;
        endpoint?: string;
        platformType?: string;
        authenticationPreferencesEnabled?: {
          responseMode?: string;
          responseType?: string;
        };
      };
    };
    correlationId?: string;
  } | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: Device binding response.
   * Contains the response from device-binding-request API call.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_deviceBindingResponse: Annotation<{
    stepUpRequest?: Array<StepUpRequestItem>;
    status?: string;
  } | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Validation methods available for step-up authentication.
   * Contains method and value only (no identifier) for UI display.
   * Exposed to UI to show available authentication options.
   */
  validationMethods: validationMethodsChannel,

  /**
   * Private field: Selected validation method.
   * Contains the complete selected method including identifier.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_selectedValidationMethod: Annotation<{
    method?: string;
    value?: string;
    identifier?: string;
  } | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: Create challenge response.
   * Contains the response from submit-idv-step-up-method API call.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_createChallengeResponse: Annotation<CreateChallengeResponse | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: One-time password entered by user.
   * Contains the OTP code entered after challenge creation.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_otpCode: Annotation<string | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: OTP validation status.
   * True if OTP was validated successfully, false if validation failed, null if not yet validated.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_isOtpValidated: Annotation<boolean | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: Validate OTP response.
   * Contains the response from validate-otp API call.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_validateOtpResponse: Annotation<ValidateOtpResponse | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: Check token status response.
   * Contains the response from get-token-status API call.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_checkTokenStatusResponse: Annotation<CheckTokenStatusResponse | null>(
    {
      reducer: (x, y) => (y !== undefined ? y : x),
      default: () => null,
    }
  ),

  /**
   * Private field: Register attestation options response.
   * Contains the response from get-device-attestation-options API call for REGISTER type.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_registerAttestationOptions: Annotation<{
    data?: {
      ignore00field?: string;
      authenticationContext?: {
        endpoint?: string;
        identifier?: string;
        payload?: string;
        action?: string;
        platformType?: string;
        authenticationPreferencesEnabled?: {
          responseMode?: string;
          responseType?: string;
        };
      };
    };
    correlationId?: string;
  } | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: Authenticate message result data.
   * Contains the complete AUTH_COMPLETE message structure from VTS.
   * Used for idempotency guard and storing authentication completion data.
   */
  private_authenticateMessageResult: Annotation<{
    assuranceData?: {
      fidoBlob?: string;
      identifier?: string;
      rpID?: string;
    };
    browserData?: {
      browserColorDepth?: string;
      browserHeader?: string;
      browserJavaEnabled?: boolean;
      browserJavascriptEnabled?: boolean;
      browserLanguage?: string;
      browserScreenHeight?: string;
      browserScreenWidth?: string;
      browserTimeZone?: string;
      ipAddress?: string;
      userAgent?: string;
    };
    contentType?: string;
    requestID?: string;
    result?: string;
    sessionContext?: string;
    type?: string;
    version?: string;
  } | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: Enroll card response.
   * Contains the response from enroll-card API call.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_enrollCardResponse: Annotation<{
    data?: {
      clientReferenceId?: string;
      status?: string;
      pendingEvents?: string[];
    };
    correlationId?: string;
  } | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * MCP connection status.
   * Set during graph initialization - true if MCP server is connected, false otherwise.
   */
  isMcpConnected: isMcpConnectedChannel,

  /**
   * Register attestation options data.
   * Exposed to UI to pass to the authenticate message popup.
   */
  registerAttestationOptions: registerAttestationOptionsChannel,

  /**
   * Current execution mode - tracks which subgraph is active.
   * Used for routing and interrupt resumption.
   * This field is NEVER exposed to external clients via the output schema.
   */
  mode: Annotation<(typeof MODE)[keyof typeof MODE] | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Public action field - for one-time operations triggered from UI.
   * UI can set this directly to trigger actions (e.g., "delete-card").
   * Router will move this to private_action for internal routing.
   * Uses shared channel to automatically sync with UI via OutputStateAnnotation.
   */
  action: actionChannel,

  /**
   * Private action field - internal routing only.
   * Router uses this to route to action-specific subgraphs.
   * Has higher priority than mode.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_action: Annotation<string | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: Token deletion completion flag.
   * Set to true after successful token deletion, used for idempotency.
   * Cleared by CLEAR_DELETE_CARD_ACTION after cleanup completes.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_tokenDeleted: Annotation<boolean | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Private field: Card addition completion flag.
   * Set to false when card addition flow starts, true when completed.
   * Used to determine if an incomplete card addition flow should continue.
   * This field is NEVER exposed to external clients via the output schema.
   */
  private_cardAdditionCompleted: Annotation<boolean | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),

  /**
   * Card deletion signal counter.
   * Increments each time a card is deleted. UI watches for changes to trigger localStorage clearing.
   * Uses shared channel to automatically sync with UI via OutputStateAnnotation.
   */
  cardDeletionSignal: cardDeletionSignalChannel,
});

/**
 * Output schema defining which fields are exposed to external clients (web).
 * Only includes messages and specific public fields - all private fields are filtered out for security.
 */
export const OutputStateAnnotation = Annotation.Root({
  messages: messagesChannel,

  /**
   * MCP connection status.
   * Exposed to frontend to display connection status indicator.
   */
  isMcpConnected: isMcpConnectedChannel,

  /**
   * Validation methods available for step-up authentication.
   * Exposed to UI to show available authentication options.
   */
  validationMethods: validationMethodsChannel,

  /**
   * Register attestation options data.
   * Exposed to UI to pass to the authenticate message popup.
   */
  registerAttestationOptions: registerAttestationOptionsChannel,

  /**
   * Provisioned token ID from Visa tokenization.
   * Exposed to UI for storage and reuse across sessions.
   * Uses same field name as GraphState (following isMcpConnected pattern).
   */
  private_tokenId: tokenIdChannel,

  /**
   * Public action field - UI can set this to trigger one-time operations.
   * Router will process this and route to appropriate action handler.
   * Uses shared channel to sync with GraphState.
   */
  action: actionChannel,

  /**
   * Card deletion signal counter.
   * UI listens for this value to change and clears localStorage when it increments.
   * Uses shared channel to sync with GraphState.
   */
  cardDeletionSignal: cardDeletionSignalChannel,
});
