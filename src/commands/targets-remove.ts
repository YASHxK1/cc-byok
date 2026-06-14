import type { AppContext } from "../app-context.js";
import { CliError } from "../core/errors.js";
import { isBuiltInTarget } from "../core/target-registry.js";

export async function runTargetsRemove(
  context: AppContext,
  targetId: string,
): Promise<void> {
  const config = await context.config.read();
  if (isBuiltInTarget(targetId)) {
    throw new CliError(
      `Built-in target "${targetId}" cannot be removed.`,
      "INVALID_INPUT",
    );
  }
  if (!config.targets[targetId]) {
    throw new CliError(`Unknown custom target "${targetId}".`, "UNKNOWN_TARGET");
  }

  const targets = { ...config.targets };
  delete targets[targetId];
  await context.config.write({
    ...config,
    activeTarget: config.activeTarget === targetId ? "claude" : config.activeTarget,
    targets,
  });
  context.output.log(`Custom target "${targetId}" removed.`);
}
