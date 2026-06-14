export const OPENROUTER = {
    id: "openrouter",
    displayName: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api",
    type: "anthropic-compatible",
    routingMode: "Anthropic and OpenAI-compatible APIs",
    supportedProfiles: ["anthropic", "openai"],
    resolveBaseUrl(configuredBaseUrl, profile) {
        return profile === "openai"
            ? "https://openrouter.ai/api/v1"
            : configuredBaseUrl;
    },
};
//# sourceMappingURL=openrouter.js.map