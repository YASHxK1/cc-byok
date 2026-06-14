import type { AppContext } from "../app-context.js";
import { requireConfiguredProvider } from "../core/provider-registry.js";

export async function runProviderList(context: AppContext): Promise<void> {
  const config = await context.config.read();
  context.output.log("Configured providers:");

  for (const [id, providerConfig] of Object.entries(config.providers)) {
    const provider = requireConfiguredProvider(config, id).definition;
    const active = config.activeProvider === id ? " (active)" : "";
    context.output.log(
      `  ${provider.displayName} [${id}]${active}\n    ${providerConfig.baseUrl}\n    ${providerConfig.type}; ${provider.routingMode}`,
    );
  }
}
