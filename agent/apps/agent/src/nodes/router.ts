import { GraphState } from "../utils/state.js";
import { MODE } from "../utils/constant.js";

/**
 * Router node that determines which subgraph to execute.
 *
 * @param state - Current graph state
 * @returns Partial state with mode/action set if needed
 */
export async function router(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  // PRIORITY 0: If public action is set, move it to private_action and clear public

  console.log("");
  console.log("=== ROUTER CALLED ===");
  console.log(
    "State snapshot:",
    JSON.stringify(
      {
        mode: state.mode,
        action: state.action,
        private_action: state.private_action,
        private_tokenId: state.private_tokenId,
        cardDeletionSignal: state.cardDeletionSignal,
        private_cardAdditionCompleted: state.private_cardAdditionCompleted,
        hasCardData: !!state.private_cardData,
        cardDataValue: state.private_cardData
          ? {
              cardNumber: state.private_cardData.cardNumber
                ? "***" + state.private_cardData.cardNumber.slice(-4)
                : undefined,
              cardholderName: state.private_cardData.cardholderName,
            }
          : null,
        email: state.email,
        product: state.product,
        budget: state.budget,
      },
      null,
      2
    )
  );
  console.log("");

  if (state.action) {
    console.log(`Router: Moving action '${state.action}' to private_action`);
    return {
      private_action: state.action,
      action: null, // Clear public action
    };
  }

  // PRIORITY 1: Check private_action for routing
  if (state.private_action) {
    console.log(
      `Router: private_action set to ${state.private_action}, routing to action handler`
    );
    return {}; // Keep private_action, let conditional routing handle it
  }

  // PRIORITY 2: Mode already set (interrupt resumption) - keep it
  if (state.mode) {
    console.log(
      `Router: mode already set to ${state.mode}, continuing in subgraph`
    );
    return {};
  }

  // Case 2a: Card addition started but not completed - continue the flow
  if (state.private_cardAdditionCompleted === false) {
    console.log("Router: card addition incomplete, continuing add-card flow");
    return { mode: MODE.ADD_CARD };
  }

  // Case 2b: No card data - enter add-card flow and mark as started
  if (!state.private_cardData || !state.private_tokenId) {
    console.log("Router: no card data, setting mode to add-card");
    return {
      mode: MODE.ADD_CARD,
      private_cardAdditionCompleted: false,
    };
  }

  // Case 3: Card data exists but missing product/budget - enter user-intent flow
  if (!state.product || !state.budget) {
    console.log("Router: missing product/budget, setting mode to user-intent");
    return { mode: MODE.USER_INTENT };
  }

  // Case 4: Everything exists - complete
  console.log("Router: all data present, completing execution");
  return {};
}
