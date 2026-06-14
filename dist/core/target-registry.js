import { CliError } from "./errors.js";
const targetList = [
    {
        id: "claude",
        name: "Claude Code",
        command: "claude",
        protocol: "anthropic",
        defaultArgs: [],
    },
    {
        id: "codex",
        name: "Codex",
        command: "codex",
        protocol: "openai",
        defaultArgs: [],
        argumentProfile: "codex",
    },
    {
        id: "codex-app",
        name: "Codex App",
        command: "codex",
        protocol: "openai",
        defaultArgs: ["app"],
    },
    {
        id: "opencode",
        name: "OpenCode",
        command: "opencode",
        protocol: "openai",
        defaultArgs: [],
    },
];
const targets = new Map(targetList.map((target) => [target.id, Object.freeze(target)]));
export function listTargets() {
    return [...targets.values()];
}
export function resolveTarget(id) {
    const target = targets.get(id);
    if (!target) {
        throw new CliError(`Unknown target "${id}". Supported targets: ${[...targets.keys()].join(", ")}.`, "UNKNOWN_TARGET");
    }
    return target;
}
//# sourceMappingURL=target-registry.js.map