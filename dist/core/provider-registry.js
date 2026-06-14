import { CliError } from "./errors.js";
import { OPENROUTER } from "../providers/openrouter.js";
import { VERCEL_AI_GATEWAY } from "../providers/vercel-ai-gateway.js";
const providers = new Map([
    [OPENROUTER.id, OPENROUTER],
    [VERCEL_AI_GATEWAY.id, VERCEL_AI_GATEWAY],
]);
export function listProviderDefinitions() {
    return [...providers.values()];
}
export function getProviderDefinition(id) {
    const provider = providers.get(id);
    if (!provider) {
        throw new CliError(`Unknown provider "${id}". Supported providers: ${[...providers.keys()].join(", ")}.`, "UNKNOWN_PROVIDER");
    }
    return provider;
}
export function requireConfiguredProvider(config, id) {
    const providerConfig = config.providers[id];
    if (!providerConfig) {
        throw new CliError(`Provider "${id}" is not configured. Add it with "cc-byok provider add ${id} --base-url <url>".`, "UNKNOWN_PROVIDER");
    }
    return {
        definition: providers.get(id) ?? customProviderDefinition(id, providerConfig),
        config: providerConfig,
    };
}
export function isBuiltInProvider(id) {
    return providers.has(id);
}
export function getBuiltInProvider(id) {
    return providers.get(id) ?? null;
}
export function validateCompatibility(provider, profile) {
    if (profile === "custom" || provider.type === "custom") {
        return {
            compatible: true,
            unknown: true,
            message: `Compatibility between provider "${provider.id}" and the custom environment profile is unknown.`,
        };
    }
    if (provider.supportedProfiles.includes(profile)) {
        return { compatible: true, unknown: false };
    }
    return {
        compatible: false,
        unknown: false,
        message: `Target expects the "${profile}" API profile, but provider "${provider.id}" is ${provider.type}.`,
    };
}
function customProviderDefinition(id, config) {
    return {
        id,
        displayName: config.displayName,
        defaultBaseUrl: config.baseUrl,
        type: config.type,
        routingMode: `custom ${config.type} gateway`,
        supportedProfiles: profilesForType(config.type),
        resolveBaseUrl: (baseUrl) => baseUrl,
    };
}
function profilesForType(type) {
    switch (type) {
        case "anthropic-compatible":
            return ["anthropic"];
        case "openai-compatible":
            return ["openai"];
        case "ollama":
            return ["ollama"];
        case "ai-gateway":
            return ["anthropic", "openai"];
        case "custom":
            return ["custom"];
    }
}
//# sourceMappingURL=provider-registry.js.map