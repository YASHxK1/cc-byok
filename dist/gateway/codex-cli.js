import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { CliError, errorMessage } from "../core/errors.js";
const execFileAsync = promisify(execFile);
export const MIN_CODEX_VERSION = "0.144.4";
export async function inspectCodex(env = process.env) {
    try {
        const { stdout, stderr } = await execFileAsync("codex", ["--version"], { env });
        const text = `${stdout} ${stderr}`;
        const version = text.match(/(\d+\.\d+\.\d+)/)?.[1] ?? null;
        return { available: true, version, supported: !!version && compareVersions(version, MIN_CODEX_VERSION) >= 0 };
    }
    catch (error) {
        if (error.code === "ENOENT")
            return { available: false, version: null, supported: false };
        return { available: false, version: null, supported: false };
    }
}
export async function requireCodex(env = process.env) {
    const info = await inspectCodex(env);
    if (!info.available)
        throw new CliError('Codex CLI was not found on PATH. Install Codex CLI 0.144.4 or newer.', "CODEX_UNAVAILABLE", 127);
    if (!info.supported)
        throw new CliError(`Codex CLI ${info.version ?? "(unknown version)"} is too old. Upgrade to ${MIN_CODEX_VERSION} or newer.`, "CODEX_TOO_OLD");
    return info.version;
}
export async function codexLoginStatus(env = process.env) {
    try {
        await execFileAsync("codex", ["login", "status"], { env });
        return true;
    }
    catch {
        return false;
    }
}
export async function runCodexCommand(args, env = process.env) {
    await requireCodex(env);
    return new Promise((resolve, reject) => {
        const child = spawn("codex", args, { env, stdio: "inherit", shell: false });
        child.once("error", (error) => reject(new CliError(`Could not run codex: ${errorMessage(error)}`, "SPAWN_FAILED", 1, { cause: error })));
        child.once("exit", (code, signal) => resolve(signal === "SIGINT" ? 130 : code ?? 1));
    });
}
function compareVersions(a, b) {
    const aa = a.split(".").map(Number), bb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++)
        if ((aa[i] ?? 0) !== (bb[i] ?? 0))
            return (aa[i] ?? 0) - (bb[i] ?? 0);
    return 0;
}
//# sourceMappingURL=codex-cli.js.map