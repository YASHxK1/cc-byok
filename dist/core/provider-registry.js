import { CliError } from "./errors.js";
import { OPENROUTER } from "../providers/openrouter.js";
const providers = new Map([
    [OPENROUTER.id, OPENROUTER],
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
    const definition = getProviderDefinition(id);
    const providerConfig = config.providers[id];
    if (!providerConfig) {
        throw new CliError(`Provider "${id}" is not configured. Run "cc-byok init" to restore built-in providers.`, "UNKNOWN_PROVIDER");
    }
    return { definition, config: providerConfig };
}
//# sourceMappingURL=provider-registry.js.map