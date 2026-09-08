import { CliError } from "./errors.js";
const targetList = [
    {
        id: "claude",
        name: "Claude Code",
        command: "claude",
        protocol: "anthropic",
        defaultArgs: [],
        restoreArgs: ["--continue"],
    },
    {
        id: "codex",
        name: "Codex",
        command: "codex",
        protocol: "openai",
        defaultArgs: [],
        restoreArgs: ["resume", "--last"],
        argumentProfile: "codex",
    },
    {
        id: "chatgpt-app",
        name: "ChatGPT App",
        command: "chatgpt",
        protocol: "openai",
        defaultArgs: [],
        restoreArgs: [],
    },
];
const targets = new Map(targetList.map((target) => [target.id, Object.freeze(target)]));
const targetAliases = new Map([['codex-app', 'chatgpt-app']]);
export function listTargets() {
    return [...targets.values()];
}
export function resolveTarget(id) {
    const target = targets.get(targetAliases.get(id) ?? id);
    if (!target) {
        throw new CliError(`Unknown target "${id}". Supported targets: ${[...targets.keys()].join(", ")}. Run "cc-byok target list" to list available targets.`, "UNKNOWN_TARGET");
    }
    return target;
}
//# sourceMappingURL=target-registry.js.map