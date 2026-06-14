import type { ProviderDefinition } from "../core/provider-registry.js";

export const OPENROUTER: ProviderDefinition = {
  id: "openrouter",
  displayName: "OpenRouter",
  defaultBaseUrl: "https://openrouter.ai/api",
  routingMode: "direct Anthropic-compatible",
  buildEnvironment({ baseUrl, apiKey, model }) {
    return {
      ANTHROPIC_BASE_URL: baseUrl,
      ANTHROPIC_AUTH_TOKEN: apiKey,
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: model,
    };
  },
};
