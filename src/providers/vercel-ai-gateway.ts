import { buildAnthropicCompatibleEnvironment } from "../core/env-builder.js";
import type { ProviderDefinition } from "../core/provider-registry.js";

export const VERCEL_AI_GATEWAY: ProviderDefinition = {
  id: "vercel",
  displayName: "Vercel AI Gateway",
  defaultBaseUrl: "https://ai-gateway.vercel.sh",
  routingMode: "direct Anthropic-compatible gateway",
  buildEnvironment: buildAnthropicCompatibleEnvironment,
};
