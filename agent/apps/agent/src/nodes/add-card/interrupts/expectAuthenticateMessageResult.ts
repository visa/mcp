import { interrupt } from "@langchain/langgraph";
import { GraphState } from "../../../utils/state.js";

/**
 * Expect Authenticate Message Result node that triggers a special popup in the UI.
 *
 * This node:
 * 1. Checks idempotency guard to prevent duplicate processing
 * 2. Triggers interrupt to display special authenticate message popup
 * 3. Receives AUTH_COMPLETE message data from UI and stores it in state
 *
 * @param state - Current graph state after register attestation options
 * @returns Updated state with AUTH_COMPLETE message data
 */
export async function expectAuthenticateMessageResult(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  // Idempotency guard: Skip if already processed
  if (state.private_authenticateMessageResult) {
    console.log("Authenticate message result already processed, skipping");
    return {};
  }

  console.log("Triggering authenticate message popup");

  // Trigger special popup in UI and wait for AUTH_COMPLETE message data
  interrupt("awaiting_authenticate_message");

  return {};
}
