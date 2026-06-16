import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runLaunch } from "./commands/launch.js";
import { runProviderAdd } from "./commands/provider-add.js";
import { runProviderList } from "./commands/provider-list.js";
import { runStatus } from "./commands/status.js";
import { runTargetList } from "./commands/target-list.js";
import { runUse } from "./commands/use.js";
export function createProgram(context) {
    const program = new Command()
        .name("cc-byok")
        .description("Launch coding agents with BYOK providers and compatible gateways")
        .version("0.3.2");
    program
        .command("init")
        .description("Initialize the global cc-byok configuration")
        .action(() => runInit(context));
    const provider = program
        .command("provider")
        .description("Manage model providers");
    provider
        .command("add")
        .description("Add a built-in or custom gateway and securely store its API key")
        .argument("<name>", "provider name")
        .option("--base-url <url>", "Anthropic-compatible base URL for a custom gateway")
        .option("--display-name <name>", "display name for a custom gateway")
        .action((name, options) => runProviderAdd(context, name, options));
    provider
        .command("list")
        .description("List configured providers")
        .action(() => runProviderList(context));
    program
        .command("use")
        .description("Set the active provider and model")
        .argument("<provider>", "provider name")
        .argument("<model-id>", "provider model ID")
        .action((providerId, modelId) => runUse(context, providerId, modelId));
    program
        .command("status")
        .description("Show the active configuration and key status")
        .action(() => runStatus(context));
    const target = program
        .command("target")
        .description("List supported launch targets");
    target
        .command("list")
        .description("List supported launch targets")
        .action(() => runTargetList(context));
    program
        .command("launch")
        .description("Launch claude, codex, codex-app, or opencode")
        .argument("[values...]", "optional target followed by target arguments")
        .option("--provider <provider>", "override the active provider")
        .option("--model <model>", "override the active model")
        .option("--restore", "restore the previous session when the target supports it")
        .allowUnknownOption(true)
        .addHelpText("after", "\nSupported targets: claude, codex, codex-app, opencode")
        .action((values = [], options) => {
        const [target, args] = splitLaunchValues(values);
        return runLaunch(context, target, args, options);
    });
    return program;
}
export function splitLaunchValues(values) {
    const first = values[0];
    if (!first || first.startsWith("-")) {
        return [undefined, values];
    }
    return [first, values.slice(1)];
}
//# sourceMappingURL=program.js.map