import type { ProtocolProfile } from "./target-registry.js";

export interface TargetEnvironmentInput {
  baseUrl: string;
  apiKey: string;
  model: string;
  protocol: ProtocolProfile;
}

export function buildTargetEnvironment({
  baseUrl,
  apiKey,
  model,
  protocol,
}: TargetEnvironmentInput): Record<string, string> {
  if (protocol === "anthropic") {
    return {
      ANTHROPIC_BASE_URL: baseUrl,
      ANTHROPIC_AUTH_TOKEN: apiKey,
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: model,
    };
  }

  return {
    OPENAI_BASE_URL: baseUrl,
    OPENAI_API_KEY: apiKey,
    OPENAI_MODEL: model,
  };
}
