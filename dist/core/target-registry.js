import { CliError } from "./errors.js";
const builtInTargetList = [
    {
        id: "claude",
        name: "Claude Code",
        description: "Anthropic's agentic coding tool",
        command: "claude",
        envProfile: "anthropic",
        defaultArgs: [],
    },
    {
        id: "codex",
        name: "Codex",
        description: "OpenAI Codex CLI",
        command: "codex",
        envProfile: "openai",
        argumentProfile: "codex",
        defaultArgs: [],
    },
    {
        id: "codex-app",
        name: "Codex App",
        description: "OpenAI Codex desktop app",
        command: "codex",
        envProfile: "openai",
        argumentProfile: "codex",
        defaultArgs: ["app"],
    },
    {
        id: "opencode",
        name: "OpenCode",
        description: "Open-source coding agent",
        command: "opencode",
        envProfile: "openai",
        defaultArgs: [],
    },
    {
        id: "hermes",
        name: "Hermes Agent",
        description: "Hermes coding agent",
        command: "hermes",
        envProfile: "openai",
        defaultArgs: [],
    },
    {
        id: "openclaw",
        name: "OpenClaw",
        description: "OpenClaw coding agent",
        command: "openclaw",
        envProfile: "openai",
        defaultArgs: [],
    },
];
const builtInTargets = new Map(builtInTargetList.map((target) => [target.id, Object.freeze(target)]));
export function listTargets(config) {
    return [
        ...[...builtInTargets.values()].map((target) => ({
            target,
            builtIn: true,
        })),
        ...Object.values(config.targets).map((target) => ({
            target,
            builtIn: false,
        })),
    ];
}
export function resolveTarget(config, id) {
    const builtIn = builtInTargets.get(id);
    if (builtIn) {
        return { target: builtIn, builtIn: true };
    }
    const custom = config.targets[id];
    if (custom) {
        return { target: custom, builtIn: false };
    }
    throw new CliError(`Unknown target "${id}". Run "cc-byok targets list" to see available targets.`, "UNKNOWN_TARGET");
}
export function isBuiltInTarget(id) {
    return builtInTargets.has(id);
}
//# sourceMappingURL=target-registry.js.map