import type { ProviderDefinition } from "../core/provider-registry.js";

export const VERCEL_AI_GATEWAY: ProviderDefinition = {
  id: "vercel",
  displayName: "Vercel AI Gateway",
  defaultBaseUrl: "https://ai-gateway.vercel.sh",
  type: "ai-gateway",
  routingMode: "Anthropic and OpenAI-compatible AI Gateway",
  supportedProfiles: ["anthropic", "openai"],
  resolveBaseUrl(configuredBaseUrl, profile) {
    return profile === "openai"
      ? "https://ai-gateway.vercel.sh/v1"
      : configuredBaseUrl;
  },
};
