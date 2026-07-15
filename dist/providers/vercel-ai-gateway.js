export const VERCEL_AI_GATEWAY = {
    id: "vercel",
    displayName: "Vercel AI Gateway",
    defaultBaseUrl: "https://ai-gateway.vercel.sh",
    routingMode: "Anthropic and OpenAI-compatible AI Gateway",
    supportedProtocols: ["anthropic", "openai", "openai-chat"],
    resolveBaseUrl(configuredBaseUrl, protocol) {
        return protocol !== "anthropic"
            ? "https://ai-gateway.vercel.sh/v1"
            : configuredBaseUrl;
    },
};
//# sourceMappingURL=vercel-ai-gateway.js.map