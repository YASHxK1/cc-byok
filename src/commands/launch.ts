import type { AppContext } from "../app-context.js";
import { CliError } from "../core/errors.js";
import { requireConfiguredProvider } from "../core/provider-registry.js";

export async function runLaunch(
  context: AppContext,
  claudeArgs: string[],
): Promise<void> {
  const config = await context.config.read();
  if (!config.activeProvider || !config.activeModel) {
    throw new CliError(
      'No active model is selected. Run "cc-byok use openrouter <model-id>".',
      "MISSING_MODEL",
    );
  }

  const provider = requireConfiguredProvider(config, config.activeProvider);
  const apiKey = await context.secrets.get(config.activeProvider);
  if (!apiKey) {
    throw new CliError(
      `No API key is stored for ${provider.definition.displayName}. Run "cc-byok provider add ${config.activeProvider}".`,
      "MISSING_KEY",
    );
  }

  const providerEnvironment = provider.definition.buildEnvironment({
    baseUrl: provider.config.baseUrl,
    apiKey,
    model: config.activeModel,
  });

  context.output.log(
    `Launching Claude Code with ${provider.definition.displayName} (${config.activeModel})...`,
  );
  const exitCode = await context.launcher.launch({
    args: claudeArgs,
    cwd: context.cwd,
    env: {
      ...context.env,
      ...providerEnvironment,
    },
  });
  context.setExitCode(exitCode);
}
