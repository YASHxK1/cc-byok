import { buildAnthropicCompatibleEnvironment } from "../core/env-builder.js";
export const VERCEL_AI_GATEWAY = {
    id: "vercel",
    displayName: "Vercel AI Gateway",
    defaultBaseUrl: "https://ai-gateway.vercel.sh",
    routingMode: "direct Anthropic-compatible gateway",
    buildEnvironment: buildAnthropicCompatibleEnvironment,
};
//# sourceMappingURL=vercel-ai-gateway.js.map