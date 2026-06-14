import { Command } from "commander";
import type { AppContext } from "./app-context.js";
import { runInit } from "./commands/init.js";
import { runLaunch } from "./commands/launch.js";
import {
  parseProviderType,
  runProviderAdd,
} from "./commands/provider-add.js";
import { runProviderList } from "./commands/provider-list.js";
import { runStatus } from "./commands/status.js";
import { runTargetsAdd } from "./commands/targets-add.js";
import { runTargetsInspect } from "./commands/targets-inspect.js";
import { runTargetsList } from "./commands/targets-list.js";
import { runTargetsRemove } from "./commands/targets-remove.js";
import { runUse } from "./commands/use.js";

export function createProgram(context: AppContext): Command {
  const program = new Command()
    .name("cc-byok")
    .description("Launch coding agents with BYOK providers and compatible gateways")
    .version("0.3.1");

  program
    .command("init")
    .description("Initialize the global cc-byok configuration")
    .action(() => runInit(context));

  const provider = program.command("provider").description("Manage model providers");
  provider
    .command("add")
    .description("Add a built-in or custom gateway and securely store its API key")
    .argument("<name>", "provider name")
    .option("--base-url <url>", "base URL for a custom gateway")
    .option("--display-name <name>", "display name for a custom gateway")
    .option(
      "--type <type>",
      "provider API type",
      parseProviderType,
    )
    .action((name, options) => runProviderAdd(context, name, options));
  provider
    .command("list")
    .description("List configured providers")
    .action(() => runProviderList(context));

  const targets = program.command("targets").description("Manage launch targets");
  targets.command("list").description("List launch targets").action(() =>
    runTargetsList(context)
  );
  targets
    .command("inspect")
    .description("Inspect a launch target")
    .argument("<target>", "target ID")
    .action((target) => runTargetsInspect(context, target));
  targets.command("add").description("Add a custom launch target").action(() =>
    runTargetsAdd(context)
  );
  targets
    .command("remove")
    .description("Remove a custom launch target")
    .argument("<target>", "target ID")
    .action((target) => runTargetsRemove(context, target));

  program
    .command("use")
    .description("Set the active provider and model")
    .argument("<provider>", "provider name")
    .argument("<model-id>", "provider model ID")
    .action((providerId, modelId) => runUse(context, providerId, modelId));

  program
    .command("status")
    .description("Show the active target, provider, and model")
    .action(() => runStatus(context));

  program
    .command("launch")
    .description("Launch a coding agent with the selected provider and model")
    .argument("[values...]", "optional target followed by target arguments")
    .option("--provider <provider>", "override the active provider")
    .option("--model <model>", "override the active model")
    .option("--force", "launch despite a known compatibility mismatch")
    .allowUnknownOption(true)
    .action(
      (
        values: string[] = [],
        options: { provider?: string; model?: string; force?: boolean },
      ) => {
        const [target, args] = splitLaunchValues(values);
        return runLaunch(context, target, args, options);
      },
    );

  return program;
}

export function splitLaunchValues(
  values: string[],
): [target: string | undefined, args: string[]] {
  const first = values[0];
  if (!first || first.startsWith("-")) return [undefined, values];
  return [first, values.slice(1)];
}
