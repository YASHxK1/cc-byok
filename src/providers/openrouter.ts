import { buildAnthropicCompatibleEnvironment } from "../core/env-builder.js";
import type { ProviderDefinition } from "../core/provider-registry.js";

export const OPENROUTER: ProviderDefinition = {
  id: "openrouter",
  displayName: "OpenRouter",
  defaultBaseUrl: "https://openrouter.ai/api",
  routingMode: "direct Anthropic-compatible",
  buildEnvironment: buildAnthropicCompatibleEnvironment,
};
