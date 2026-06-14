import { getProviderDefinition } from "../core/provider-registry.js";
export async function runProviderList(context) {
    const config = await context.config.read();
    context.output.log("Configured providers:");
    for (const [id, providerConfig] of Object.entries(config.providers)) {
        const provider = getProviderDefinition(id);
        const active = config.activeProvider === id ? " (active)" : "";
        context.output.log(`  ${provider.displayName} [${id}]${active}\n    ${providerConfig.baseUrl}`);
    }
}
//# sourceMappingURL=provider-list.js.map