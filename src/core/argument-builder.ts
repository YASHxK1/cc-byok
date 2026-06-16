import type { LaunchTarget } from "./target-registry.js";

export interface TargetArgumentsInput {
  target: LaunchTarget;
  providerName: string;
  baseUrl: string;
  model: string;
  restore: boolean;
  userArgs: string[];
}

export function buildTargetArguments({
  target,
  providerName,
  baseUrl,
  model,
  restore,
  userArgs,
}: TargetArgumentsInput): string[] {
  const routingArgs = target.argumentProfile === "codex"
    ? buildCodexArguments(providerName, baseUrl, model)
    : [];
  const restoreArgs = restore ? target.restoreArgs ?? [] : [];

  return [...target.defaultArgs, ...routingArgs, ...restoreArgs, ...userArgs];
}

function buildCodexArguments(
  providerName: string,
  baseUrl: string,
  model: string,
): string[] {
  const providerId = "cc_byok";
  return [
    "-c",
    `model=${tomlString(model)}`,
    "-c",
    `model_provider=${tomlString(providerId)}`,
    "-c",
    `model_providers.${providerId}.name=${tomlString(providerName)}`,
    "-c",
    `model_providers.${providerId}.base_url=${tomlString(baseUrl)}`,
    "-c",
    `model_providers.${providerId}.env_key="OPENAI_API_KEY"`,
    "-c",
    `model_providers.${providerId}.wire_api="responses"`,
  ];
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}
