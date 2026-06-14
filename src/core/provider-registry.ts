import type { Config } from "./config-schema.js";
import { CliError } from "./errors.js";
import { OPENROUTER } from "../providers/openrouter.js";

export interface ProviderEnvironmentInput {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ProviderDefinition {
  id: string;
  displayName: string;
  defaultBaseUrl: string;
  routingMode: string;
  buildEnvironment(input: ProviderEnvironmentInput): Record<string, string>;
}

const providers = new Map<string, ProviderDefinition>([
  [OPENROUTER.id, OPENROUTER],
]);

export function listProviderDefinitions(): ProviderDefinition[] {
  return [...providers.values()];
}

export function getProviderDefinition(id: string): ProviderDefinition {
  const provider = providers.get(id);
  if (!provider) {
    throw new CliError(
      `Unknown provider "${id}". Supported providers: ${[...providers.keys()].join(", ")}.`,
      "UNKNOWN_PROVIDER",
    );
  }
  return provider;
}

export function requireConfiguredProvider(config: Config, id: string) {
  const definition = getProviderDefinition(id);
  const providerConfig = config.providers[id];
  if (!providerConfig) {
    throw new CliError(
      `Provider "${id}" is not configured. Run "cc-byok init" to restore built-in providers.`,
      "UNKNOWN_PROVIDER",
    );
  }
  return { definition, config: providerConfig };
}
