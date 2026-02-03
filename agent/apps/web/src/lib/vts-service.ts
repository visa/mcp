/**
 * VTS Service Layer
 *
 * Central service for handling all VTS (Visa Token Service) postMessage communication.
 * This service manages iframe creation, message listeners, and message handling for
 * both initial authentication and device attestation flows.
 *
 * Prevents message listener conflicts by maintaining a single global listener.
 */

import { getClientDeviceId } from "./vts-utils";
import { getVTSIframe, cleanupVTSIframe } from "./vts-utils";
import { updateCardStatus } from "./card-storage";

// Extend Window interface for global listener
declare global {
  interface Window {
    vtsMessageListener?: (event: MessageEvent) => void;
  }
}

/**
 * Authentication session data structure returned by VTS
 */
export interface AuthenticationSessionData {
  result?: string;
  browserData?: Record<string, any>;
  authenticationPreferencesSupported?: Record<string, any>;
  sessionContext?: string;
  dfpSessionID?: string;
  requestID?: string;
  type?: string;
  version?: string;
}

/**
 * Authentication context for AUTHENTICATE message
 */
export interface AuthenticationContext {
  identifier: string;
  endpoint: string;
  payload: string;
  action: string;
  requestID: string;
  authenticationPreferencesEnabled?: {
    responseMode?: string;
    responseType?: string;
  };
}

/**
 * VTS message types
 * Note: VTS may send additional fields not listed here
 */
interface VTSMessage {
  type:
    | "AUTH_READY"
    | "AUTH_SESSION_CREATED"
    | "RESULT"
    | "AUTH_SUCCESS"
    | "AUTH_COMPLETE"
    | "AUTH_FAILED"
    | "AUTH_NOT_SUPPORTED";
  result?: "COMPLETE" | string;
  error?: string;
  requestID?: string;
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
  authenticationPreferencesSupported?: Record<string, any>;
  sessionContext?: string;
  dfpSessionID?: string;
  version?: string;
  contentType?: string;
  assuranceData?: {
    fidoBlob?: string;
    identifier?: string;
    rpID?: string;
  };
  // Allow any additional fields from VTS
  [key: string]: any;
}

/**
 * Internal state for managing VTS flows
 */
interface VTSState {
  iframe: HTMLIFrameElement | null;
  vtsBaseUrl: string;
  allowedOrigin: string;
  // Callbacks for initial auth flow (vts-auth-handler)
  authCallbacks?: {
    onSuccess: (data: AuthenticationSessionData) => void;
    onError: (error: string) => void;
    onStatusChange: (status: "loading" | "success" | "error") => void;
  };
  // Callbacks for authenticate flow (authenticate-message-handler)
  authenticateCallbacks?: {
    onSuccess: () => void;
    onError: (error: string) => void;
  };
}

// Global state
let vtsState: VTSState | null = null;

/**
 * Initialize VTS authentication flow
 *
 * Sets up iframe and message listener for initial VTS authentication.
 * Handles AUTH_READY → CREATE_AUTH_SESSION → AUTH_SESSION_CREATED flow.
 *
 * @param callbacks - Callbacks for success, error, and status changes
 * @returns Cleanup function to remove listener
 */
export function initializeVTSAuth(callbacks: {
  onSuccess: (data: AuthenticationSessionData) => void;
  onError: (error: string) => void;
  onStatusChange: (status: "loading" | "success" | "error") => void;
}): () => void {
  console.log("[VTS Service] Initializing VTS authentication");

  // Get VTS configuration
  const vtsBaseUrl =
    process.env.NEXT_PUBLIC_VTS_AUTH_BASE_URL ||
    "https://sbx.vts.auth.visa.com";
  const apiKey = process.env.NEXT_PUBLIC_VTS_API_KEY;
  const externalAppId = process.env.NEXT_PUBLIC_VTS_EXTERNAL_APP_ID;

  if (!apiKey || !externalAppId) {
    console.error("[VTS Service] VTS environment variables not configured");
    callbacks.onError("VTS authentication is not configured");
    callbacks.onStatusChange("error");
    return () => {};
  }

  const allowedOrigin = new URL(vtsBaseUrl).origin;

  // Create or reuse iframe (async)
  getVTSIframe(vtsBaseUrl)
    .then((iframe) => {
      // Initialize state
      vtsState = {
        iframe,
        vtsBaseUrl,
        allowedOrigin,
        authCallbacks: callbacks,
      };

      // Set up message listener
      setupMessageListener();
    })
    .catch((error) => {
      console.error("[VTS Service] Failed to create iframe:", error);
      callbacks.onError("Failed to initialize VTS authentication");
      callbacks.onStatusChange("error");
    });

  // Return cleanup function
  return () => {
    cleanupVTSResources();
  };
}

/**
 * Set up postMessage listener for VTS iframe communication
 *
 * Creates a global message listener that handles all VTS message types.
 * Prevents conflicts by using a single global listener.
 */
function setupMessageListener(): void {
  // Remove existing listener if any
  if (window.vtsMessageListener) {
    console.log("[VTS Service] Removing existing message listener");
    window.removeEventListener("message", window.vtsMessageListener);
  }

  console.log("[VTS Service] Setting up postMessage listener");

  const messageListener = (event: MessageEvent) => {
    if (!vtsState) return;

    // Validate origin
    if (event.origin !== vtsState.allowedOrigin) {
      console.warn(
        "[VTS Service] Ignoring message from unauthorized origin:",
        event.origin,
      );
      return;
    }

    let message: VTSMessage;
    try {
      message =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    } catch (error) {
      console.error("[VTS Service] Failed to parse message:", error);
      return;
    }

    console.log("[VTS Service] Received message:", message);

    // Handle message based on type
    handleVTSMessage(message);
  };

  // Store globally and add listener
  window.vtsMessageListener = messageListener;
  window.addEventListener("message", messageListener);
  console.log("[VTS Service] PostMessage listener set up");
}

/**
 * Handle different VTS message types
 *
 * Routes messages to appropriate handlers based on type.
 *
 * @param message - Parsed VTS message
 */
function handleVTSMessage(message: VTSMessage): void {
  if (!vtsState) return;

  switch (message.type) {
    case "AUTH_READY":
      handleAuthReady(message);
      break;

    case "AUTH_SESSION_CREATED":
      handleAuthSessionCreated(message);
      break;

    default:
      console.log("[VTS Service] Unknown message type:", message.type);
      handleAuthFailed(message);
  }
}

/**
 * Handle AUTH_READY message
 *
 * VTS iframe is ready - send CREATE_AUTH_SESSION message.
 *
 * @param message - AUTH_READY message data
 */
function handleAuthReady(message: VTSMessage): void {
  if (!vtsState || !vtsState.iframe) return;

  console.log("[VTS Service] AUTH_READY received, creating auth session");

  // Store requestID in session storage for later use
  const requestID = message.requestID;
  if (requestID) {
    sessionStorage.setItem("vts_requestID", requestID);
    console.log(
      "[VTS Service] Stored requestID in session storage:",
      requestID,
    );
  }

  // Get client device ID
  const clientDeviceId = getClientDeviceId();
  console.log("[VTS Service] Using client device ID:", clientDeviceId);

  // Send CREATE_AUTH_SESSION message
  const createAuthSessionMessage = {
    type: "CREATE_AUTH_SESSION",
    requestID: message.requestID,
    version: "1",
    client: { id: clientDeviceId },
  };

  console.log(
    "[VTS Service] Sending CREATE_AUTH_SESSION:",
    createAuthSessionMessage,
  );

  if (vtsState.iframe.contentWindow) {
    vtsState.iframe.contentWindow.postMessage(
      createAuthSessionMessage,
      vtsState.allowedOrigin,
    );
    console.log("[VTS Service] CREATE_AUTH_SESSION sent");
  } else {
    console.error("[VTS Service] Iframe contentWindow not available");
  }
}

/**
 * Handle AUTH_SESSION_CREATED message
 *
 * Authentication session established - call success callback.
 *
 * @param message - AUTH_SESSION_CREATED message data
 */
function handleAuthSessionCreated(message: VTSMessage): void {
  if (!vtsState || !vtsState.authCallbacks) return;

  console.log("[VTS Service] AUTH_SESSION_CREATED received");

  if (message.result === "COMPLETE") {
    console.log("[VTS Service] Authentication completed successfully");

    const authData: AuthenticationSessionData = {
      result: message.result,
      browserData: message.browserData,
      authenticationPreferencesSupported:
        message.authenticationPreferencesSupported,
      sessionContext: message.sessionContext,
      dfpSessionID: message.dfpSessionID,
      requestID: message.requestID,
      type: message.type,
      version: message.version,
    };

    vtsState.authCallbacks.onSuccess(authData);
    vtsState.authCallbacks.onStatusChange("success");
  } else {
    console.error("[VTS Service] Authentication failed:", message.error);
    vtsState.authCallbacks.onError(message.error || "Authentication failed");
    vtsState.authCallbacks.onStatusChange("error");
  }
}

/**
 * Clean up VTS authentication resources
 *
 * Centralizes cleanup logic for message listeners, iframes, and state.
 */
function cleanupVTSResources(): void {
  console.log("[VTS Service] Cleaning up VTS authentication resources");

  try {
    // Remove event listener
    if (window.vtsMessageListener) {
      window.removeEventListener("message", window.vtsMessageListener);
      delete window.vtsMessageListener;
      console.log("[VTS Service] Removed postMessage listener");
    }

    // Remove iframe
    if (vtsState?.iframe) {
      cleanupVTSIframe(vtsState.iframe);
      vtsState.iframe = null;
    }

    // Clear state
    vtsState = null;
  } catch (error) {
    console.error("[VTS Service] Error during cleanup:", error);
  }
}

/**
 * Handle AUTH_FAILED message
 *
 * Authentication failed - call error callback.
 *
 * @param message - AUTH_FAILED message data
 */
function handleAuthFailed(message: VTSMessage): void {
  console.error("[VTS Service] AUTH_FAILED received:", message);

  if (vtsState?.authCallbacks) {
    vtsState.authCallbacks.onError(message.error || "Authentication failed");
    vtsState.authCallbacks.onStatusChange("error");
  }

  if (vtsState?.authenticateCallbacks) {
    vtsState.authenticateCallbacks.onError(
      message.error || "Authentication failed",
    );
  }
}

/**
 * Sends AUTHENTICATE message to existing VTS iframe
 * Reuses iframe created during initial auth flow
 *
 * @param authContext - Authentication context data
 * @param streamContext - Stream context for sending completion signal to agent
 * @param callbacks - Callbacks for success and error
 */
export function sendAuthenticateMessageToExistingIframe(
  authContext: AuthenticationContext,
  streamContext: {
    submit: (data: any, options: any) => void;
    currentModel: string;
  },
  callbacks: {
    onSuccess: () => void;
    onError: (error: string) => void;
  },
): void {
  try {
    console.log("[VTS Iframe] Starting AUTHENTICATE flow with visible iframe");

    // Get existing iframe (created during initial auth)
    const iframe = document.getElementById(
      "vts-auth-iframe",
    ) as HTMLIFrameElement;

    if (!iframe || !iframe.contentWindow) {
      console.error("[VTS Iframe] Iframe not found or not accessible");
      callbacks.onError(
        "VTS authentication iframe not found. Please refresh and try again.",
      );
      return;
    }

    console.log("[VTS Iframe] Found existing iframe, making it visible");

    iframe.style.display = "block";
    iframe.style.position = "fixed";
    iframe.style.top = "50%";
    iframe.style.left = "50%";
    iframe.style.transform = "translate(-50%, -50%)";
    iframe.style.width = "500px"; // Fixed width to match VTS content
    iframe.style.height = "700px"; // Taller to accommodate passkey UI
    iframe.style.border = "none"; // Remove border for cleaner look
    iframe.style.borderRadius = "12px"; // Rounded corners
    iframe.style.boxShadow =
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"; // Larger shadow
    iframe.style.zIndex = "9999";
    iframe.style.backgroundColor = "white";
    iframe.style.overflow = "hidden"; // Hide overflow, let iframe handle scrolling internally

    // Optional: Add backdrop overlay
    const backdrop = document.createElement("div");
    backdrop.id = "vts-iframe-backdrop";
    backdrop.style.position = "fixed";
    backdrop.style.top = "0";
    backdrop.style.left = "0";
    backdrop.style.width = "100%";
    backdrop.style.height = "100%";
    backdrop.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    backdrop.style.zIndex = "9998";
    document.body.appendChild(backdrop);

    // Get VTS configuration for origin validation
    const vtsBaseUrl =
      process.env.NEXT_PUBLIC_VTS_AUTH_BASE_URL ||
      "https://sbx.vts.auth.visa.com";

    // CRITICAL: Remove existing message listener to avoid conflicts
    if (window.vtsMessageListener) {
      console.log("[VTS Iframe] Removing old message listener");
      window.removeEventListener("message", window.vtsMessageListener);
      window.vtsMessageListener = undefined;
    }

    // Set up NEW message listener for AUTHENTICATE responses
    setupAuthenticateMessageListener(
      streamContext,
      callbacks,
      vtsBaseUrl,
      iframe,
      backdrop,
    );

    // Compose AUTHENTICATE message
    const authenticateMessage = {
      type: "AUTHENTICATE",
      requestID: authContext.requestID,
      version: "1",
      authenticationContext: {
        identifier: authContext.identifier,
        endpoint: authContext.endpoint,
        payload: authContext.payload,
        action: authContext.action,
        authenticationPreferencesEnabled:
          authContext.authenticationPreferencesEnabled,
      },
    };

    console.log("[VTS Iframe] Sending AUTHENTICATE message to iframe");

    // Send AUTHENTICATE message to iframe
    iframe.contentWindow.postMessage(authenticateMessage, vtsBaseUrl);

    console.log("[VTS Iframe] AUTHENTICATE message sent successfully");
  } catch (error) {
    console.error("[VTS Iframe] Error sending AUTHENTICATE message:", error);
    callbacks.onError(
      `Failed to send AUTHENTICATE message: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Set up message listener for AUTHENTICATE responses from iframe
 * Hides iframe and backdrop after completion
 *
 * @param streamContext - Stream context for sending completion signal to agent
 * @param callbacks - Callbacks for success and error
 * @param vtsBaseUrl - VTS base URL for origin validation
 * @param iframe - The iframe element to hide after completion
 * @param backdrop - The backdrop element to remove after completion
 */
function setupAuthenticateMessageListener(
  streamContext: {
    submit: (data: any, options: any) => void;
    currentModel: string;
  },
  callbacks: {
    onSuccess: () => void;
    onError: (error: string) => void;
  },
  vtsBaseUrl: string,
  iframe: HTMLIFrameElement,
  backdrop: HTMLElement,
): void {
  const messageListener = (event: MessageEvent) => {
    // Validate origin
    const allowedOrigin = new URL(vtsBaseUrl).origin;

    if (event.origin !== allowedOrigin) {
      // Silently ignore messages from other origins
      return;
    }

    let message: any;
    try {
      message =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;
    } catch (error) {
      // Silently ignore invalid messages
      return;
    }

    console.log("[VTS Iframe] Received message from iframe:", message);

    // Ignore AUTH_READY messages (those are for initial auth only)
    if (message.type === "AUTH_READY") {
      console.log(
        "[VTS Iframe] Ignoring AUTH_READY message (not part of AUTHENTICATE flow)",
      );
      return;
    }

    // Handle RESULT or AUTH_SUCCESS messages
    if (
      message.type === "RESULT" ||
      message.type === "AUTH_SUCCESS" ||
      message.type === "AUTH_COMPLETE"
    ) {
      console.log("[VTS Iframe] AUTHENTICATE completed successfully");

      // CRITICAL: Hide iframe and backdrop
      iframe.style.display = "none";
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }

      // Call success callback
      callbacks.onSuccess();

      // Update card status to active after successful authentication
      updateCardStatus("active");

      // CRITICAL: Send completion signal to agent with complete AUTH_COMPLETE message data
      console.log("[VTS Iframe] Sending AUTH_COMPLETE data to agent:", message);
      streamContext.submit(
        {
          private_authenticateMessageResult: {
            assuranceData: message.assuranceData,
            browserData: message.browserData,
            contentType: message.contentType,
            requestID: message.requestID,
            result: message.result,
            sessionContext: message.sessionContext,
            type: message.type,
            version: message.version,
          },
        } as any,
        {
          streamMode: ["values"],
          config: {
            configurable: {
              model: streamContext.currentModel,
            },
          },
        },
      );

      // Remove listener after completion
      window.removeEventListener("message", messageListener);
      window.vtsMessageListener = undefined;
      console.log("[VTS Iframe] Cleaned up message listener");
    } else {
      console.error("[VTS Iframe] AUTHENTICATE failed:", message.error);

      // CRITICAL: Hide iframe and backdrop
      iframe.style.display = "none";
      if (backdrop && backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }

      // Call error callback
      callbacks.onError(message.error || "Authentication failed");

      // Send failure signal to agent
      streamContext.submit(
        {
          private_authenticateMessageResult: {
            status: "FAILED",
            error: message.error || "Authentication failed",
            timestamp: Date.now(),
          },
        } as any,
        {
          streamMode: ["values"],
          config: {
            configurable: {
              model: streamContext.currentModel,
            },
          },
        },
      );

      // Remove listener after failure
      window.removeEventListener("message", messageListener);
      window.vtsMessageListener = undefined;
      console.log("[VTS Iframe] Cleaned up message listener after failure");
    }
  };

  // Store globally and add listener
  window.vtsMessageListener = messageListener;
  window.addEventListener("message", messageListener);
  console.log(
    "[VTS Iframe] Message listener set up for AUTHENTICATE responses",
  );
}
