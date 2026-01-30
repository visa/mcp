import { interrupt } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { GraphState } from "../../../utils/state.js";

/**
 * VTS Secure Token collection node that conditionally pauses execution.
 *
 * This node:
 * 1. Checks if VTS authentication data is present in state
 * 2. If missing and retry count < 1: calls interrupt() to trigger frontend VTS flow
 * 3. If missing and retry count >= 1: returns error message (max retries exceeded)
 * 4. If complete: returns success message and allows graph to continue
 *
 * The interrupt triggers the frontend to:
 * - Create hidden iframe with VTS authentication URL
 * - Listen for postMessage events (AUTH_READY → CREATE_AUTH_SESSION → AUTH_SESSION_CREATED)
 * - Submit AuthenticationSessionData back to agent
 *
 * @param state - Current graph state with VTS authentication data
 * @returns Partial state update with messages or empty if data exists
 */
export async function expectVtsSecureToken(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  // Idempotency guard: Skip if VTS authentication already completed
  if (state.private_vtsAuthenticationSessionData) {
    console.log("VTS authentication already completed, skipping");
    return {}; // Return empty state to preserve existing data and avoid duplicate messages
  }

  // Check retry count
  const retryCount = state.private_vtsRetryCount || 0;

  if (retryCount >= 1) {
    console.error("VTS authentication failed after maximum retries");
    return {
      messages: [
        new AIMessage({
          content:
            "We're experiencing technical difficulties with the authentication service. Please try again later.",
          additional_kwargs: {
            ui_only: true,
          },
        }),
      ],
    };
  }

  // VTS data missing and retries available - interrupt
  console.log(
    `Interrupting for VTS authentication (attempt ${retryCount + 1})`
  );
  interrupt("awaiting_vts_authentication");

  // This return is technically unreachable due to interrupt() throwing,
  // but TypeScript requires it
  return {};
}
