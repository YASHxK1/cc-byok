import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AppContext } from "../app-context.js";
import { buildTargetArguments } from "../core/argument-builder.js";
import { configureCodexAppProfile } from "../core/codex-app-profile.js";
import { buildTargetEnvironment } from "../core/env-builder.js";
import { CliError } from "../core/errors.js";
import {
  requireConfiguredProvider,
  validateCompatibility,
} from "../core/provider-registry.js";
import { resolveTarget } from "../core/target-registry.js";

export interface LaunchOptions {
  provider?: string;
  model?: string;
}

export async function runLaunch(
  context: AppContext,
  targetId: string | undefined,
  targetArgs: string[],
  options: LaunchOptions = {},
): Promise<void> {
  const config = await context.config.read();
  const providerId = options.provider?.trim() || config.activeProvider;
  const model = options.model?.trim() || config.activeModel;
  if (!providerId || !model) {
    throw new CliError(
      'No active model is selected. Run "cc-byok use openrouter <model-id>" or pass --provider and --model.',
      "MISSING_MODEL",
    );
  }

  const target = resolveTarget(targetId ?? "claude");
  const provider = requireConfiguredProvider(config, providerId);
  validateCompatibility(provider.definition, target.protocol);

  const apiKey = await context.secrets.get(providerId);
  if (!apiKey) {
    throw new CliError(
      `No API key is stored for ${provider.definition.displayName}. Run "cc-byok provider add ${providerId}".`,
      "MISSING_KEY",
    );
  }

  const baseUrl = provider.definition.resolveBaseUrl(
    provider.config.baseUrl,
    target.protocol,
  );
  const targetEnvironment = buildTargetEnvironment({
    baseUrl,
    apiKey,
    model,
    protocol: target.protocol,
  });

  if (target.id === "codex-app") {
    const codexHome = context.env.CODEX_HOME?.trim() || join(homedir(), ".codex");
    const credentialHelper = fileURLToPath(
      new URL("../credential-helper.js", import.meta.url),
    );
    await configureCodexAppProfile({
      codexHome,
      providerId,
      providerName: provider.definition.displayName,
      baseUrl,
      model,
      credentialHelper,
    });
  }

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
  context.setExitCode(exitCode);
}
