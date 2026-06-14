import type { AppContext } from "../app-context.js";
import { buildTargetArguments } from "../core/argument-builder.js";
import { buildTargetEnvironment, targetNeedsApiKey } from "../core/env-builder.js";
import { CliError } from "../core/errors.js";
import {
  requireConfiguredProvider,
  validateCompatibility,
} from "../core/provider-registry.js";
import { resolveTarget } from "../core/target-registry.js";

export interface LaunchOptions {
  provider?: string;
  model?: string;
  force?: boolean;
}

export async function runLaunch(
  context: AppContext,
  targetId: string | undefined,
  targetArgs: string[],
  options: LaunchOptions = {},
): Promise<void> {
  const config = await context.config.read();
  const selectedTargetId = targetId || config.activeTarget || "claude";
  const providerId = options.provider?.trim() || config.activeProvider;
  const model = options.model?.trim() || config.activeModel;

  if (!providerId || !model) {
    throw new CliError(
      'No active model is selected. Run "cc-byok use openrouter <model-id>" or pass --provider and --model.',
      "MISSING_MODEL",
    );
  }

  const { target } = resolveTarget(config, selectedTargetId);
  const provider = requireConfiguredProvider(config, providerId);
  const compatibility = validateCompatibility(
    provider.definition,
    target.envProfile,
  );

  if (!compatibility.compatible && !options.force) {
    throw new CliError(
      `${compatibility.message} Use --force to launch without an adapter check.`,
      "INCOMPATIBLE_TARGET",
    );
  }
  if (compatibility.message) {
    context.output.error(
      `Warning: ${compatibility.message}${options.force ? " Proceeding because --force was supplied." : ""}`,
    );
  }

  let apiKey: string | null = null;
  if (targetNeedsApiKey(target)) {
    apiKey = await context.secrets.get(providerId);
    if (!apiKey) {
      throw new CliError(
        `No API key is stored for ${provider.definition.displayName}. Run "cc-byok provider add ${providerId}".`,
        "MISSING_KEY",
      );
    }
  }

  const baseUrl = provider.definition.resolveBaseUrl(
    provider.config.baseUrl,
    target.envProfile,
  );
  const targetEnvironment = buildTargetEnvironment({
    baseUrl,
    apiKey,
    model,
    target,
  });

  context.output.log(
    `Launching ${target.name} with ${provider.definition.displayName} (${model})...`,
  );
  const exitCode = await context.launcher.launch({
    targetId: target.id,
    targetName: target.name,
    command: target.command,
    args: buildTargetArguments({
      target,
      providerName: provider.definition.displayName,
      baseUrl,
      model,
      userArgs: targetArgs,
    }),
    cwd: context.cwd,
    env: {
      ...context.env,
      ...targetEnvironment,
    },
  });

  if (targetId && config.activeTarget !== target.id) {
    await context.config.write({ ...config, activeTarget: target.id });
  }
  context.setExitCode(exitCode);
}
