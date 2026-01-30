import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { RunnableConfig } from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";

// Read model parameters from environment variables
const TOP_P = process.env.MODEL_TOP_P
  ? parseFloat(process.env.MODEL_TOP_P)
  : undefined;
const TOP_K = process.env.MODEL_TOP_K
  ? parseInt(process.env.MODEL_TOP_K)
  : undefined;

/**
 * Filters out UI-only messages that shouldn't be sent to LLM.
 * Removes messages marked with additional_kwargs.ui_only = true.
 *
 * These messages are meant for UI display only and should not be
 * included in the LLM context to avoid:
 * - Confusing the LLM with duplicate information
 * - Wasting tokens on redacted data
 * - Polluting the conversation context
 */
function filterMessagesForLLM(messages: BaseMessage[]): BaseMessage[] {
  return messages.filter((msg) => {
    return !msg.additional_kwargs?.ui_only;
  });
}

/**
 * Cleans trailing whitespace from message content to ensure Anthropic API compliance.
 * The Anthropic API rejects requests where assistant messages end with trailing whitespace.
 *
 * @param messages - Array of messages to clean
 * @returns New array with cleaned message content
 */
function cleanMessageWhitespace(messages: BaseMessage[]): BaseMessage[] {
  return messages.map((msg) => {
    if (
      typeof msg.content === "string" &&
      msg.content.trimEnd() !== msg.content
    ) {
      // Create new message with trimmed content
      const MessageClass = msg.constructor as any;
      return new MessageClass({
        ...msg,
        content: msg.content.trimEnd(),
      });
    }
    return msg;
  });
}

/**
 * Prepares messages for LLM by applying all necessary transformations:
 * 1. Filters out UI-only messages
 * 2. Cleans trailing whitespace to ensure API compliance
 *
 * This is the single source of truth for message preparation.
 *
 * @param messages - Array of messages to prepare
 * @returns Cleaned and filtered messages ready for LLM
 */
function prepareMessagesForLLM(messages: BaseMessage[]): BaseMessage[] {
  const filtered = filterMessagesForLLM(messages);
  return cleanMessageWhitespace(filtered);
}

/**
 * Invokes a Runnable (chain, model, structured model) with filtered messages.
 * Filters UI-only messages and cleans whitespace before invoking.
 *
 * @param runnable - The Runnable to invoke (chain, model, structured model, etc.)
 * @param input - The input to pass to the Runnable
 * @param options - Optional configuration for the invoke call
 * @returns The result of the Runnable invocation
 */
export async function invokeWithFiltering<T = any>(
  runnable: any,
  input: any,
  options?: any
): Promise<T> {
  // Filter messages from input
  let filteredInput = input;
  if (Array.isArray(input)) {
    // Direct array of messages: model.invoke([msg1, msg2])
    filteredInput = prepareMessagesForLLM(input);
  } else if (input?.messages && Array.isArray(input.messages)) {
    // Object with messages property: chain.invoke({ messages: [...] })
    filteredInput = {
      ...input,
      messages: prepareMessagesForLLM(input.messages),
    };
  }

  return runnable.invoke(filteredInput, options);
}

/**
 * Load a chat model from the config.
 * @param config - RunnableConfig containing the model name in configurable.model
 * @returns A Promise that resolves to a BaseChatModel instance.
 * @throws Error if model is not provided in config or if provider is missing
 */
export async function loadChatModel(
  config: RunnableConfig
): Promise<ChatOpenAI | ChatAnthropic> {
  // Extract and validate model name from config
  const fullySpecifiedName = config.configurable?.model;

  if (!fullySpecifiedName) {
    throw new Error("Model is required. Please select a model in the UI.");
  }

  const index = fullySpecifiedName.indexOf("/");

  if (index === -1) {
    // No provider specified - require it!
    throw new Error(
      `Model name must include provider prefix (e.g., "openai/gpt-5" or "anthropic/claude-sonnet-4-5"). Got: "${fullySpecifiedName}"`
    );
  }

  // Provider specified (e.g., "openai/gpt-5")
  const provider = fullySpecifiedName.slice(0, index);
  const model = fullySpecifiedName.slice(index + 1);

  if (provider === "openai") {
    // Create OpenAI client with just the model name
    // The base URL and API key are read from environment variables automatically
    return new ChatOpenAI({
      model: model, // Just "gpt-5", not "openai/gpt-5"
    });
  } else if (provider === "anthropic") {
    // Create Anthropic client
    const options: Record<string, any> = { model: model };
    if (TOP_P !== undefined) options.topP = TOP_P;
    if (TOP_K !== undefined) options.topK = TOP_K;
    return new ChatAnthropic(options);
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
