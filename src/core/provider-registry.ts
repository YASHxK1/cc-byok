import type { Config, ProviderConfig } from "./config-schema.js";
import { CliError } from "./errors.js";
import { buildAnthropicCompatibleEnvironment } from "./env-builder.js";
import { OPENROUTER } from "../providers/openrouter.js";
import { VERCEL_AI_GATEWAY } from "../providers/vercel-ai-gateway.js";

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
  [VERCEL_AI_GATEWAY.id, VERCEL_AI_GATEWAY],
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
  const providerConfig = config.providers[id];
  if (!providerConfig) {
    throw new CliError(
      `Provider "${id}" is not configured. Add it with "cc-byok provider add ${id} --base-url <url>".`,
      "UNKNOWN_PROVIDER",
    );
  }
  return {
    definition: providers.get(id) ?? customProviderDefinition(id, providerConfig),
    config: providerConfig,
  };
}

export function isBuiltInProvider(id: string): boolean {
  return providers.has(id);
}

export function getBuiltInProvider(id: string): ProviderDefinition | null {
  return providers.get(id) ?? null;
}

function customProviderDefinition(
  id: string,
  config: ProviderConfig,
): ProviderDefinition {
  return {
    id,
    displayName: config.displayName,
    defaultBaseUrl: config.baseUrl,
    routingMode: "custom Anthropic-compatible gateway",
    buildEnvironment: buildAnthropicCompatibleEnvironment,
  };
}
