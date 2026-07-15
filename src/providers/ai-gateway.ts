import type { ProviderDefinition } from "../core/provider-registry.js";

export const AI_GATEWAY: ProviderDefinition = {
  id: "ai-gateway",
  displayName: "AI Gateway (local Codex)",
  defaultBaseUrl: "http://127.0.0.1:3000/v1",
  routingMode: "Local Anthropic Messages and OpenAI Chat Completions gateway backed by Codex",
  supportedProtocols: ["anthropic", "openai-chat"],
  resolveBaseUrl(configuredBaseUrl, protocol) {
    return protocol === "anthropic" ? configuredBaseUrl.replace(/\/v1\/?$/, "") : configuredBaseUrl;
  },
};
