import { interrupt } from "@langchain/langgraph";
import { GraphState } from "../../../utils/state.js";

/**
 * Validation method check node that handles CHALLENGE flow.
 *
 * This node:
 * 1. If validation method already selected with identifier: log and continue
 * 2. If validation method selected but missing identifier: enrich with identifier from deviceBindingResponse
 * 3. If validationMethods exist in state: interrupt and wait for user selection
 * 4. Otherwise: continue
 *
 * Note: validationMethods are prepared by the deviceBinding node and added to state before this node runs.
 *
 * @param state - Current graph state
 * @returns State update with enriched selection or empty
 */
export async function expectValidationMethod(
  state: typeof GraphState.State
): Promise<Partial<typeof GraphState.State>> {
  const selectedMethod = state.private_selectedValidationMethod;

  // Scenario 1: Already selected with identifier - done
  if (selectedMethod?.identifier) {
    console.log("Validation method already selected");
    return {};
  }

  // Scenario 2: Selected but missing identifier - enrich it
  if (selectedMethod && !selectedMethod.identifier) {
    const deviceBindingResponse = state.private_deviceBindingResponse;
    // Find the full entry with identifier from device binding response
    const fullMethod = deviceBindingResponse?.stepUpRequest?.find(
      (item) =>
        item.method === selectedMethod.method &&
        item.value === selectedMethod.value
    );

    if (fullMethod) {
      console.log("Enriching selected method with identifier");
      return {
        private_selectedValidationMethod: {
          method: fullMethod.method,
          value: fullMethod.value,
          identifier: fullMethod.identifier,
        },
      };
    }

    console.warn("Could not find matching method with identifier");
    return {};
  }

  // Scenario 3: No selection yet - check if we have validation methods to choose from
  if (state.validationMethods && state.validationMethods.length > 0) {
    console.log(
      "Validation methods available, interrupting for user selection"
    );
    interrupt("awaiting_validation_method");
  }

  // No validation methods available (shouldn't happen if routing is correct)
  console.log("No validation methods available, continuing");
  return {};
}
