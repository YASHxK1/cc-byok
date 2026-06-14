import { buildAnthropicCompatibleEnvironment } from "../core/env-builder.js";
export const OPENROUTER = {
    id: "openrouter",
    displayName: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api",
    routingMode: "direct Anthropic-compatible",
    buildEnvironment: buildAnthropicCompatibleEnvironment,
};
//# sourceMappingURL=openrouter.js.map