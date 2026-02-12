import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableConfig } from "@langchain/core/runnables";
import { loadChatModel } from "../utils/llmConfig.js";

/**
 * System prompt for the intent clarification agent.
 * Instructs the LLM to analyze the conversation and ask for missing information.
 */
const CLARIFY_INTENT_SYSTEM_PROMPT = `You are a shopping assistant that helps users make purchases.

Your task is to greet the user and:
1. Extract the product name the user wants to buy.
2. Extract their budget (in dollars).

If either piece of information is missing or unclear from the conversation:
- Politely ask for the missing information in your response
- Be conversational and friendly
- Ask specific questions (e.g., "What product would you like to buy?" or "What's your budget in dollars?")

Once you have BOTH product name AND budget clearly stated:
- Respond with EXACTLY ONE sentence of the form:
  "You want to buy <product> with a budget of $<amount>. I will help you with this purchase."
- Do NOT add any additional sentence or words before or after this sentence.

Current time: {system_time}`;

/**
 * Prompt template for the intent clarification agent.
 * Combines system prompt with conversation messages.
 */
const clarifyIntentPrompt = ChatPromptTemplate.fromMessages([
  ["system", CLARIFY_INTENT_SYSTEM_PROMPT],
  ["placeholder", "{messages}"],
]);

/**
 * Creates the intent clarification chain.
 * The model generates conversational responses to gather information.
 *
 * @param config - RunnableConfig containing the model selection
 * @returns A chain that combines the prompt template with the model
 */
export async function createClarifyIntentChain(config: RunnableConfig) {
  const model = await loadChatModel(config);
  return clarifyIntentPrompt.pipe(model);
}
