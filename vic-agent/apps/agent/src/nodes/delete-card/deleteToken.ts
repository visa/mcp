import { RunnableConfig } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import { GraphState } from "../../utils/state.js";
import type { ExecutionContext } from "../../utils/execution-context/index.js";

/**
 * Delete token node that calls delete-token MCP tool.
 *
 * On success: Increments cardDeletionSignal counter to trigger UI localStorage clearing.
 * Flow continues to SIGNAL_UI_CARD_DELETED (checkpoint) then CLEAR_DELETE_CARD_ACTION.
 * On error: Keeps all data intact, shows error, action will be cleared by next node
 *
 * @param state - Current graph state
 * @param config - RunnableConfig containing tool registry
 * @returns Partial state update with cardDeletionSignal incremented or error message
 */
export async function deleteToken(
  state: typeof GraphState.State,
  config: RunnableConfig
): Promise<Partial<typeof GraphState.State>> {
  // Idempotency guard: skip if deletion already performed in this flow
  if (state.private_tokenDeleted === true) {
    console.log(
      "DELETE_TOKEN: Token already deleted (private_tokenDeleted is true), skipping"
    );
    return {};
  }
  const context = config.configurable?.executionContext as ExecutionContext;

  if (!context) {
    console.error("ExecutionContext not found in config.configurable");
    return {
      messages: [
        new AIMessage(
          "We encountered a configuration issue. Please try again later."
        ),
      ],
    };
  }

  if (!state.private_tokenId) {
    console.error("No token ID found in state, cannot delete");
    return {
      messages: [
        new AIMessage("No card found to delete. Please add a card first."),
      ],
    };
  }

  try {
    const payload = {
      vProvisionedTokenID: state.private_tokenId,
      updateReason: {
        reasonCode: "CUSTOMER_CONFIRMED",
      },
    };

    console.log("Calling delete-token with tokenId:", state.private_tokenId);

    const { result, messages: toolMessages } = await context.deleteToken(
      state.private_tokenId,
      payload
    );

    console.log("Delete token successful, result:", result);

    // SUCCESS: Signal UI to clear localStorage and show success message
    // Increment cardDeletionSignal counter to trigger UI clearing
    // Flow continues to SIGNAL_UI_CARD_DELETED (checkpoint) then CLEAR_DELETE_CARD_ACTION
    return {
      // Mark deletion as completed (idempotency flag)
      private_tokenDeleted: true,

      // Increment deletion counter to signal UI (streams reliably)
      cardDeletionSignal: (state.cardDeletionSignal || 0) + 1,

      // Send success message
      messages: [
        ...toolMessages,
        new AIMessage(
          "Your card has been successfully removed. All associated data has been cleared."
        ),
      ],
      // Note: private_tokenId and other state will be cleared in CLEAR_DELETE_CARD_ACTION
    };
  } catch (error) {
    console.error("Error in deleteToken:", error);

    // ERROR: Keep all data, just show error message
    // Action will be cleared by next node to exit subgraph
    return {
      messages: [
        new AIMessage(
          "We encountered an issue while removing your card. Please try again later. Your card data has been preserved."
        ),
      ],
    };
  }
}
