import type { AppContext } from "../app-context.js";
import { CliError } from "../core/errors.js";
import { requireConfiguredProvider } from "../core/provider-registry.js";

export async function runStatus(context: AppContext): Promise<void> {
  const config = await context.config.read();
  if (!config.activeProvider || !config.activeModel) {
    throw new CliError(
      'No active model is selected. Run "cc-byok use openrouter <model-id>".',
      "MISSING_MODEL",
    );
  }

  const provider = requireConfiguredProvider(config, config.activeProvider);
  const hasKey = await context.secrets.has(config.activeProvider);
  context.output.log(
    [
      `Config: ${context.paths.configFile}`,
      `Provider: ${provider.definition.displayName} [${config.activeProvider}]`,
      `Model: ${config.activeModel}`,
      `Base URL: ${provider.config.baseUrl}`,
      `API key: ${hasKey ? "stored" : "missing"}`,
    ].join("\n"),
  );
}
