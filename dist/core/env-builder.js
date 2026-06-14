export function buildAnthropicCompatibleEnvironment({ baseUrl, apiKey, model, }) {
    return {
        ANTHROPIC_BASE_URL: baseUrl,
        ANTHROPIC_AUTH_TOKEN: apiKey,
        ANTHROPIC_API_KEY: "",
        ANTHROPIC_MODEL: model,
    };
}
//# sourceMappingURL=env-builder.js.map