import type { ProviderDefinition } from "../core/provider-registry.js";

export const VERCEL_AI_GATEWAY: ProviderDefinition = {
  id: "vercel",
  displayName: "Vercel AI Gateway",
  defaultBaseUrl: "https://ai-gateway.vercel.sh",
  routingMode: "Anthropic and OpenAI-compatible AI Gateway",
  supportedProtocols: ["anthropic", "openai"],
  resolveBaseUrl(configuredBaseUrl, protocol) {
    return protocol === "openai"
      ? "https://ai-gateway.vercel.sh/v1"
      : configuredBaseUrl;
  },
};
