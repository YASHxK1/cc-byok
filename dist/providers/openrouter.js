export const OPENROUTER = {
    id: "openrouter",
    displayName: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api",
    routingMode: "Anthropic and OpenAI-compatible APIs",
    supportedProtocols: ["anthropic", "openai", "openai-chat"],
    resolveBaseUrl(configuredBaseUrl, protocol) {
        return protocol !== "anthropic"
            ? "https://openrouter.ai/api/v1"
            : configuredBaseUrl;
    },
};
//# sourceMappingURL=openrouter.js.map