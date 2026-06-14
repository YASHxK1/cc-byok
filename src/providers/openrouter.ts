import type { ProviderDefinition } from "../core/provider-registry.js";

export const OPENROUTER: ProviderDefinition = {
  id: "openrouter",
  displayName: "OpenRouter",
  defaultBaseUrl: "https://openrouter.ai/api",
  routingMode: "Anthropic and OpenAI-compatible APIs",
  supportedProtocols: ["anthropic", "openai"],
  resolveBaseUrl(configuredBaseUrl, protocol) {
    return protocol === "openai"
      ? "https://openrouter.ai/api/v1"
      : configuredBaseUrl;
  },
};
