import type { AppContext } from "../app-context.js";
import { launchTargetSchema } from "../core/config-schema.js";
import { CliError } from "../core/errors.js";
import { isBuiltInTarget } from "../core/target-registry.js";

export async function runTargetsAdd(context: AppContext): Promise<void> {
  const config = await context.config.read();
  const prompted = await context.prompts.customTarget();
  validateTargetId(prompted.id);

  if (isBuiltInTarget(prompted.id)) {
    throw new CliError(
      `Target "${prompted.id}" is built in and cannot be replaced.`,
      "INVALID_INPUT",
    );
  }
  if (config.targets[prompted.id]) {
    throw new CliError(
      `Custom target "${prompted.id}" already exists. Remove it before adding it again.`,
      "INVALID_INPUT",
    );
  }

  const target = launchTargetSchema.parse({
    ...prompted,
    defaultArgs: prompted.defaultArgs ?? [],
  });
  if (
    target.envProfile === "custom"
    && !Object.values(target.customEnvMapping ?? {}).some(Boolean)
  ) {
    throw new CliError(
      "A custom environment profile must map at least one environment variable.",
      "INVALID_INPUT",
    );
  }

  await context.config.write({
    ...config,
    targets: {
      ...config.targets,
      [target.id]: target,
    },
  });
  context.output.log(`Custom target "${target.id}" added.`);
}

function validateTargetId(id: string): void {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new CliError(
      "Target ID must contain only lowercase letters, numbers, and hyphens.",
      "INVALID_INPUT",
    );
  }
}
