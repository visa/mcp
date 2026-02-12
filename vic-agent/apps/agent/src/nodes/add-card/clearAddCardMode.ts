import { GraphState } from "../../utils/state.js";

/**
 * Clear mode node - final node in add card subgraph.
 * Clears the mode to allow router to make next decision.
 *
 * @param _state - Current graph state (unused)
 * @returns Partial state with mode cleared
 */
export async function clearAddCardMode(
  _state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("Clearing add-card mode and marking as completed");
  return {
    mode: null,
    private_cardAdditionCompleted: true,
  };
}
