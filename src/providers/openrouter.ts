import type { ProviderDefinition } from "../core/provider-registry.js";

export const OPENROUTER: ProviderDefinition = {
  id: "openrouter",
  displayName: "OpenRouter",
  defaultBaseUrl: "https://openrouter.ai/api",
  routingMode: "Anthropic and OpenAI-compatible APIs",
  supportedProtocols: ["anthropic", "openai", "openai-chat"],
  resolveBaseUrl(configuredBaseUrl, protocol) {
    return protocol !== "anthropic"
      ? "https://openrouter.ai/api/v1"
      : configuredBaseUrl;
  },
};
