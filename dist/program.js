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
        .description("Use Claude Code with your own OpenRouter API key")
        .version("0.1.0");
    program
        .command("init")
        .description("Initialize the global cc-byok configuration")
        .action(() => runInit(context));
    const provider = program
        .command("provider")
        .description("Manage model providers");
    provider
        .command("add")
        .description("Securely store a provider API key")
        .argument("<name>", "provider name")
        .action((name) => runProviderAdd(context, name));
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