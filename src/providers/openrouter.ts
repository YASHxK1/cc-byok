import type { ProviderDefinition } from "../core/provider-registry.js";

export const OPENROUTER: ProviderDefinition = {
  id: "openrouter",
  displayName: "OpenRouter",
  defaultBaseUrl: "https://openrouter.ai/api",
  type: "anthropic-compatible",
  routingMode: "Anthropic and OpenAI-compatible APIs",
  supportedProfiles: ["anthropic", "openai"],
  resolveBaseUrl(configuredBaseUrl, profile) {
    return profile === "openai"
      ? "https://openrouter.ai/api/v1"
      : configuredBaseUrl;
  },
};
