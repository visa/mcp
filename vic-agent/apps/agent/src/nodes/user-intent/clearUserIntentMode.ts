import { GraphState } from "../../utils/state.js";

/**
 * Clear mode node - final node in user intent subgraph.
 * Clears the mode to allow router to make next decision.
 *
 * This node is called after successfully collecting product and budget information.
 * Clearing the mode signals to the router that it should re-evaluate the state
 * and determine the next appropriate subgraph or complete execution.
 *
 * @param _state - Current graph state (unused)
 * @returns Partial state with mode cleared
 */
export async function clearUserIntentMode(
  _state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  console.log("Clearing user-intent mode");
  return { mode: null };
}
