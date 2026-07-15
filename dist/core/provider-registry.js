import { CliError } from "./errors.js";
import { OPENROUTER } from "../providers/openrouter.js";
import { VERCEL_AI_GATEWAY } from "../providers/vercel-ai-gateway.js";
import { AI_GATEWAY } from "../providers/ai-gateway.js";
const providers = new Map([
    [OPENROUTER.id, OPENROUTER],
    [VERCEL_AI_GATEWAY.id, VERCEL_AI_GATEWAY],
    [AI_GATEWAY.id, AI_GATEWAY],
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
export function validateCompatibility(provider, protocol) {
    if (!provider.supportedProtocols.includes(protocol)) {
        throw new CliError(`Target expects the "${protocol}" protocol, but provider "${provider.id}" supports only: ${provider.supportedProtocols.join(", ")}.`, "INCOMPATIBLE_TARGET");
    }
}
function customProviderDefinition(id, config) {
    return {
        id,
        displayName: config.displayName,
        defaultBaseUrl: config.baseUrl,
        routingMode: "custom Anthropic-compatible gateway",
        supportedProtocols: ["anthropic"],
        resolveBaseUrl: (baseUrl) => baseUrl,
    };
}
//# sourceMappingURL=provider-registry.js.map