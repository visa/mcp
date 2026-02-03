import { interrupt } from "@langchain/langgraph";
import { GraphState } from "../../../utils/state.js";

/**
 * OTP code check node that conditionally pauses execution.
 *
 * This node:
 * 1. Checks if OTP code is present in state
 * 2. Validates that a challenge was created (prerequisite)
 * 3. If OTP missing: calls interrupt() to pause and wait for user to enter OTP
 * 4. If complete: returns empty state and allows graph to continue
 *
 * @param state - Current graph state with OTP code
 * @returns Empty state object (no changes needed)
 */
export async function expectOtp(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  // Check if OTP already provided (idempotency)
  if (state.private_otpCode) {
    console.log("OTP already provided");
    return {};
  }

  // Validate prerequisite: challenge must be created
  if (!state.private_createChallengeResponse) {
    console.warn("No challenge created yet");
    return {};
  }

  // Interrupt to wait for user OTP input
  console.log("Interrupting for OTP input");
  interrupt("awaiting_otp");

  return {};
}
