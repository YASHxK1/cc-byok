import type { AppContext } from "../app-context.js";
import { listTargets } from "../core/target-registry.js";

export async function runTargetList(context: AppContext): Promise<void> {
  context.output.log("Available targets:");

  for (const target of listTargets()) {
    const restore = target.restoreArgs ? "restore supported" : "restore unsupported";
    context.output.log(
      `  ${target.name} [${target.id}]\n    command: ${target.command}\n    protocol: ${target.protocol}\n    ${restore}`,
    );
  }
}
