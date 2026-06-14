import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { runLaunch } from "./commands/launch.js";
import { runProviderAdd } from "./commands/provider-add.js";
import { runProviderList } from "./commands/provider-list.js";
import { runStatus } from "./commands/status.js";
import { runUse } from "./commands/use.js";
export function createProgram(context) {
    const program = new Command()
        .name("cc-byok")
        .description("Use Claude Code with BYOK providers and compatible gateways")
        .version("0.2.0");
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
    program
        .command("launch")
        .description("Launch Claude Code with the active provider and model")
        .argument("[claude-args...]", "arguments forwarded to Claude Code")
        .allowUnknownOption(true)
        .action((claudeArgs = []) => runLaunch(context, claudeArgs));
    return program;
}
//# sourceMappingURL=program.js.map