import type { AppContext } from "../app-context.js";
import { CliError } from "../core/errors.js";
import {
  getProviderDefinition,
  requireConfiguredProvider,
} from "../core/provider-registry.js";

export async function runProviderAdd(
  context: AppContext,
  providerId: string,
): Promise<void> {
  const provider = getProviderDefinition(providerId);
  const config = await context.config.read();
  requireConfiguredProvider(config, providerId);

  if (await context.secrets.has(providerId)) {
    const replace = await context.prompts.confirmReplace(provider.displayName);
    if (!replace) {
      throw new CliError("Cancelled. The stored API key was not changed.", "CANCELLED", 0);
    }
  }

  const apiKey = (await context.prompts.apiKey(provider.displayName)).trim();
  if (!apiKey) {
    throw new CliError("API key cannot be empty.", "INVALID_INPUT");
  }

  await context.secrets.set(providerId, apiKey);
  context.output.log(`${provider.displayName} API key saved securely.`);
}
