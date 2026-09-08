import type { AppContext } from "../app-context.js";
import { CliError } from "../core/errors.js";

export async function runCatalogAdd(
  context: AppContext,
  modelId: string,
): Promise<void> {
  const cleanModelId = modelId.trim();
  if (!cleanModelId) {
    throw new CliError("Model ID is required.", "INVALID_INPUT");
  }

  const config = await context.config.read();
  if (config.extraModels.includes(cleanModelId)) {
    context.output.log(`Model "${cleanModelId}" is already in the model catalog.`);
    return;
  }

  await context.config.write({
    ...config,
    extraModels: [...config.extraModels, cleanModelId],
  });
  context.output.log(`Added "${cleanModelId}" to the model catalog.`);
}

export async function runCatalogRemove(
  context: AppContext,
  modelId: string,
): Promise<void> {
  const cleanModelId = modelId.trim();
  if (!cleanModelId) {
    throw new CliError("Model ID is required.", "INVALID_INPUT");
  }

  const config = await context.config.read();
  const nextModels = config.extraModels.filter((model) => model !== cleanModelId);
  if (nextModels.length === config.extraModels.length) {
    throw new CliError(
      `Model "${cleanModelId}" is not in the model catalog.`,
      "INVALID_INPUT",
    );
  }

  await context.config.write({ ...config, extraModels: nextModels });
  context.output.log(`Removed "${cleanModelId}" from the model catalog.`);
}

export async function runCatalogList(context: AppContext): Promise<void> {
  const config = await context.config.read();
  context.output.log("Model catalog:");
  if (config.extraModels.length === 0) {
    context.output.log("  (empty)");
    return;
  }
  for (const model of config.extraModels) {
    context.output.log(`  ${model}`);
  }
}
