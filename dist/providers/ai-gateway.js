export const AI_GATEWAY = {
    id: "ai-gateway",
    displayName: "AI Gateway (local Codex)",
    defaultBaseUrl: "http://127.0.0.1:3000/v1",
    routingMode: "Local Anthropic Messages gateway backed by Codex",
    supportedProtocols: ["anthropic"],
    resolveBaseUrl(configuredBaseUrl) {
        return configuredBaseUrl.replace(/\/v1\/?$/, "");
    },
};
//# sourceMappingURL=ai-gateway.js.map