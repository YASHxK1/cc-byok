import type {
  Config,
  EnvProfile,
  ProviderConfig,
  ProviderType,
} from "./config-schema.js";
import { CliError } from "./errors.js";
import { OPENROUTER } from "../providers/openrouter.js";
import { VERCEL_AI_GATEWAY } from "../providers/vercel-ai-gateway.js";

export interface ProviderDefinition {
  id: string;
  displayName: string;
  defaultBaseUrl: string;
  type: ProviderType;
  routingMode: string;
  supportedProfiles: EnvProfile[];
  resolveBaseUrl(configuredBaseUrl: string, profile: EnvProfile): string;
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

export function validateCompatibility(
  provider: ProviderDefinition,
  profile: EnvProfile,
): { compatible: boolean; unknown: boolean; message?: string } {
  if (profile === "custom" || provider.type === "custom") {
    return {
      compatible: true,
      unknown: true,
      message: `Compatibility between provider "${provider.id}" and the custom environment profile is unknown.`,
    };
  }

  if (provider.supportedProfiles.includes(profile)) {
    return { compatible: true, unknown: false };
  }

  return {
    compatible: false,
    unknown: false,
    message: `Target expects the "${profile}" API profile, but provider "${provider.id}" is ${provider.type}.`,
  };
}

function customProviderDefinition(
  id: string,
  config: ProviderConfig,
): ProviderDefinition {
  return {
    id,
    displayName: config.displayName,
    defaultBaseUrl: config.baseUrl,
    type: config.type,
    routingMode: `custom ${config.type} gateway`,
    supportedProfiles: profilesForType(config.type),
    resolveBaseUrl: (baseUrl) => baseUrl,
  };
}

function profilesForType(type: ProviderType): EnvProfile[] {
  switch (type) {
    case "anthropic-compatible":
      return ["anthropic"];
    case "openai-compatible":
      return ["openai"];
    case "ollama":
      return ["ollama"];
    case "ai-gateway":
      return ["anthropic", "openai"];
    case "custom":
      return ["custom"];
  }
}
