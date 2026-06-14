import type { AppContext } from "../app-context.js";

export async function runInit(context: AppContext): Promise<void> {
  const result = await context.config.initialize();
  context.output.log(
    result.created
      ? `Initialized cc-byok at ${context.paths.configFile}`
      : `cc-byok is already initialized at ${context.paths.configFile}`,
  );
}
