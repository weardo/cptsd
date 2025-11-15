/**
 * Helper functions for OpenAI API calls
 */

/**
 * Check if a model requires max_completion_tokens instead of max_tokens
 * Newer models (o1 series, GPT-5 series) require max_completion_tokens
 */
export function requiresMaxCompletionTokens(model: string): boolean {
  // Models that require max_completion_tokens
  const modelsRequiringMaxCompletionTokens = [
    'o1',
    'o1-preview',
    'o1-mini',
    'gpt-5',
    'gpt-5-turbo',
    'gpt-5.1',
    'gpt-5.1-instant',
    'gpt-5.1-thinking',
  ];

  return modelsRequiringMaxCompletionTokens.some((pattern) =>
    model.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Get the appropriate token limit parameter for a model
 * Returns either max_tokens or max_completion_tokens based on the model
 */
export function getTokenLimitParams(
  model: string,
  tokenLimit: number
): { max_tokens?: number; max_completion_tokens?: number } {
  if (requiresMaxCompletionTokens(model)) {
    return { max_completion_tokens: tokenLimit };
  }
  return { max_tokens: tokenLimit };
}

