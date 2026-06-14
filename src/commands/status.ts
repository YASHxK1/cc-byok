import type { AppContext } from "../app-context.js";
import { CliError } from "../core/errors.js";
import { requireConfiguredProvider } from "../core/provider-registry.js";
import { resolveTarget } from "../core/target-registry.js";

export async function runStatus(context: AppContext): Promise<void> {
  const config = await context.config.read();
  if (!config.activeProvider || !config.activeModel) {
    throw new CliError(
      'No active model is selected. Run "cc-byok use openrouter <model-id>".',
      "MISSING_MODEL",
    );
  }

  const provider = requireConfiguredProvider(config, config.activeProvider);
  const { target } = resolveTarget(config, config.activeTarget);
  const baseUrl = provider.definition.resolveBaseUrl(
    provider.config.baseUrl,
    target.envProfile,
  );
  context.output.log(
    [
      `Config: ${context.paths.configFile}`,
      `Active target: ${target.id}`,
      `Active provider: ${config.activeProvider}`,
      `Active model: ${config.activeModel}`,
      `Provider type: ${provider.config.type}`,
      `Target env profile: ${target.envProfile}`,
      `Base URL: ${baseUrl}`,
      "API key: ************",
    ].join("\n"),
  );
}
