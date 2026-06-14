import type { ProviderEnvironmentInput } from "./provider-registry.js";

export function buildAnthropicCompatibleEnvironment({
  baseUrl,
  apiKey,
  model,
}: ProviderEnvironmentInput): Record<string, string> {
  return {
    ANTHROPIC_BASE_URL: baseUrl,
    ANTHROPIC_AUTH_TOKEN: apiKey,
    ANTHROPIC_API_KEY: "",
    ANTHROPIC_MODEL: model,
  };
}
