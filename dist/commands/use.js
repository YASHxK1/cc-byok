import { CliError } from "../core/errors.js";
import { requireConfiguredProvider } from "../core/provider-registry.js";
export async function runUse(context, providerId, modelId) {
    const cleanProviderId = providerId.trim();
    const cleanModelId = modelId.trim();
    if (!cleanProviderId || !cleanModelId) {
        throw new CliError("Provider and model ID are required.", "INVALID_INPUT");
    }
    const config = await context.config.read();
    const provider = requireConfiguredProvider(config, cleanProviderId);
    await context.config.write({
        ...config,
        activeProvider: cleanProviderId,
        activeModel: cleanModelId,
    });
    context.output.log([
        "Active model set:",
        `  Provider: ${provider.definition.displayName}`,
        `  Model: ${cleanModelId}`,
        `  Base URL: ${provider.config.baseUrl}`,
        `  Mode: ${provider.definition.routingMode}`,
    ].join("\n"));
}
//# sourceMappingURL=use.js.map