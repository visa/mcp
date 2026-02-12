import { RunnableConfig } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import { GraphState } from "../../utils/state.js";

/**
 * Authenticate Attestation Options node that exposes device attestation options for AUTHENTICATE type.
 *
 * This node:
 * 1. Validates that private_deviceAttestationOptions exists in state
 * 2. Checks for required fields: identifier and payload in authenticationContext
 * 3. Copies private_deviceAttestationOptions to public registerAttestationOptions field
 * 4. Returns appropriate success message
 *
 * @param state - Current graph state with private_deviceAttestationOptions
 * @param _config - RunnableConfig
 * @returns Partial state update with registerAttestationOptions and message
 */
export async function authenticateAttestationOptions(
  state: typeof GraphState.State,
  _config: RunnableConfig
): Promise<Partial<typeof GraphState.State>> {
  // Idempotency guard: Skip if already exposed attestation options
  if (state.registerAttestationOptions) {
    console.log("Authenticate attestation options already exposed, skipping");
    return {}; // Return empty state to preserve existing data
  }

  try {
    // Validate required state data
    if (!state.private_deviceAttestationOptions) {
      throw new Error("Missing private_deviceAttestationOptions in state");
    }

    // Validate that identifier and payload are present
    const hasIdentifier =
      state.private_deviceAttestationOptions?.data?.authenticationContext
        ?.identifier;
    const hasPayload =
      state.private_deviceAttestationOptions?.data?.authenticationContext
        ?.payload;

    const messages = [];

    if (!hasIdentifier || !hasPayload) {
      messages.push(
        new AIMessage({
          content:
            "Attestation Options Authenticate Partial Success! Cannot send AUTHENTICATE message without identifier and payload",
          additional_kwargs: {
            ui_only: true,
          },
        })
      );
    } else {
      messages.push(
        new AIMessage({
          content:
            "Device authentication attestation options retrieved successfully.",
          additional_kwargs: {
            ui_only: true,
          },
        })
      );
    }

    // Copy private_deviceAttestationOptions to public registerAttestationOptions field
    return {
      registerAttestationOptions: state.private_deviceAttestationOptions,
      messages,
    };
  } catch (error) {
    console.error("Error in authenticateAttestationOptions:", error);

    return {
      messages: [
        new AIMessage({
          content:
            "We encountered an issue while exposing device authentication attestation options. Please try again later.",
          additional_kwargs: {
            ui_only: true,
          },
        }),
      ],
    };
  }
}
