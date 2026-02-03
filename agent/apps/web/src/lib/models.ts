export interface ModelOption {
  value: string;
  label: string;
  provider: string;
}

/**
 * Format a model name into a human-readable label
 * Example: "claude-sonnet-4-5-20250929" -> "Claude Sonnet 4 5"
 */
function formatModelName(modelName: string): string {
  return modelName
    .replace(/-/g, " ")
    .replace(/\d{8}$/, "") // Remove date suffix
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .trim();
}

/**
 * Get the list of available models from environment variable
 * Falls back to default models if not configured
 */
export function getAvailableModels(): ModelOption[] {
  const modelsEnv = process.env.NEXT_PUBLIC_AVAILABLE_MODELS;

  // Fallback to default models if env var not set
  const modelsList = modelsEnv
    ? modelsEnv.split(",").map((m) => m.trim())
    : [
        "anthropic/claude-sonnet-4-5-20250929",
        "anthropic/claude-opus-4-5-20251101",
        "anthropic/claude-sonnet-3-5-20241022",
      ];

  return modelsList.map((modelValue) => {
    // Parse provider and model name for display
    const parts = modelValue.split("/");
    const provider = parts.length > 1 ? parts[0] : "anthropic";
    const modelName = parts.length > 1 ? parts[1] : modelValue;

    // Create friendly label
    const label = formatModelName(modelName);

    return {
      value: modelValue,
      label: label,
      provider,
    };
  });
}

/**
 * Get the default model from environment variable
 */
export function getDefaultModel(): string {
  return (
    process.env.NEXT_PUBLIC_DEFAULT_MODEL ||
    "anthropic/claude-sonnet-4-5-20250929"
  );
}

/**
 * Validate if a model is in the available models list
 */
export function isValidModel(model: string): boolean {
  const availableModels = getAvailableModels();
  return availableModels.some((m) => m.value === model);
}
