import { GraphState } from "../../utils/state.js";

/**
 * No state changes - this node exists only to force a stream emission.
 *
 * @param _state - Current graph state (unchanged)
 * @returns Empty object (no state changes)
 */
export async function signalUICardDeleted(
  _state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  // No state changes - this node exists only to force a stream emission
  return {};
}
