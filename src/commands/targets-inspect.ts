import type { AppContext } from "../app-context.js";
import { resolveTarget } from "../core/target-registry.js";

export async function runTargetsInspect(
  context: AppContext,
  targetId: string,
): Promise<void> {
  const config = await context.config.read();
  const { target, builtIn } = resolveTarget(config, targetId);
  const command = [target.command, ...(target.defaultArgs ?? [])].join(" ");
  const mapping = target.customEnvMapping
    ? `\nEnvironment mapping: ${JSON.stringify(target.customEnvMapping)}`
    : "";

  context.output.log(
    [
      `Target: ${target.name} [${target.id}]`,
      `Type: ${builtIn ? "built-in" : "custom"}`,
      `Command: ${command}`,
      `Environment profile: ${target.envProfile}`,
      `Description: ${target.description || "none"}`,
    ].join("\n") + mapping,
  );
}
