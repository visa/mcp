import { interrupt } from "@langchain/langgraph";
import { GraphState } from "../../../utils/state.js";

/**
 * Interrupt check node that conditionally pauses execution.
 *
 * This node:
 * 1. Checks if product and budget are present in state
 * 2. If missing: calls interrupt() to pause and wait for user input
 * 3. If complete: returns empty state and allows graph to continue
 *
 * @param state - Current graph state with extracted product/budget
 * @returns Empty state object (no changes needed)
 */
export async function expectUserIntent(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  // If data is missing, interrupt
  if (!state.product || !state.budget) {
    interrupt("awaiting_input");
  }

  // Data is complete, return empty (no state changes)
  return {};
}
