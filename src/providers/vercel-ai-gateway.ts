import type { ProviderDefinition } from "../core/provider-registry.js";

export const VERCEL_AI_GATEWAY: ProviderDefinition = {
  id: "vercel",
  displayName: "Vercel AI Gateway",
  defaultBaseUrl: "https://ai-gateway.vercel.sh",
  routingMode: "Anthropic and OpenAI-compatible AI Gateway",
  supportedProtocols: ["anthropic", "openai", "openai-chat"],
  resolveBaseUrl(configuredBaseUrl, protocol) {
    return protocol !== "anthropic"
      ? "https://ai-gateway.vercel.sh/v1"
      : configuredBaseUrl;
  },
};
