export const OPENROUTER = {
    id: "openrouter",
    displayName: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api",
    routingMode: "Anthropic and OpenAI-compatible APIs",
    supportedProtocols: ["anthropic", "openai"],
    resolveBaseUrl(configuredBaseUrl, protocol) {
        return protocol === "openai"
            ? "https://openrouter.ai/api/v1"
            : configuredBaseUrl;
    },
};
//# sourceMappingURL=openrouter.js.map