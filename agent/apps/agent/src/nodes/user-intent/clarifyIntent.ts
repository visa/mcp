import { RunnableConfig } from "@langchain/core/runnables";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { z } from "zod";
import { createClarifyIntentChain } from "../../chains/clarifyIntentChain.js";
import { loadChatModel, invokeWithFiltering } from "../../utils/llmConfig.js";
import { GraphState } from "../../utils/state.js";

/**
 * Schema for extracting product and budget information.
 * Fields are nullable to handle cases where extraction fails.
 */
const ShoppingInfoSchema = z.object({
  product: z
    .string()
    .nullable()
    .describe("The product name, or null if not clearly stated"),
  budget: z
    .number()
    .nullable()
    .describe("The budget in dollars, or null if not clearly stated"),
});

/**
 * Intent clarification node that collects product name and budget from the user.
 *
 * This node:
 * 1. Always generates a conversational response (either asking for info or confirming)
 * 2. Always performs structured extraction after generating the response
 * 3. Returns both the message and extracted data
 * 4. The graph interrupts after this node, allowing the user to provide input
 * 5. The routing logic decides next step based on state.product and state.budget
 *
 * @param state - Current graph state with messages and extracted data
 * @param config - RunnableConfig containing model selection
 * @returns Partial state update with new message and extracted product/budget
 */
export async function clarifyIntent(
  state: typeof GraphState.State,
  config: RunnableConfig
): Promise<Partial<typeof GraphState.State>> {
  // Idempotency guard: Skip if product and budget already extracted
  if (state.product && state.budget) {
    console.log(
      "Product and budget already extracted (product:",
      state.product,
      ", budget:",
      state.budget,
      "), skipping clarification"
    );
    return {}; // Return empty state to preserve existing values
  }

  // Step 1: Always generate a conversational response first
  const chain = await createClarifyIntentChain(config);
  const response = await invokeWithFiltering(chain, {
    messages: state.messages,
    system_time: new Date().toISOString(),
  });

  // Step 2: Always perform structured extraction
  const model = await loadChatModel(config);
  const structuredModel = (model as BaseChatModel).withStructuredOutput(
    ShoppingInfoSchema
  );

  const extraction = await invokeWithFiltering(structuredModel, [
    [
      "system",
      "Extract the product name and budget from this conversation. If either is not clearly stated, return null for that field.",
    ],
    ...state.messages,
    response,
  ]);

  return {
    messages: [response],
    product: extraction.product,
    budget: extraction.budget,
  };
}
