import { spawn } from "node:child_process";
import { CliError, errorMessage } from "./errors.js";
export class ChildProcessLauncher {
    async launch(request) {
        return new Promise((resolve, reject) => {
            const child = spawn(request.command, request.args, {
                cwd: request.cwd,
                env: request.env,
                stdio: "inherit",
                shell: false,
            });
            const forwardSignal = (signal) => {
                if (!child.killed) {
                    child.kill(signal);
                }
            };
            const signals = ["SIGINT", "SIGTERM"];
            for (const signal of signals) {
                process.on(signal, forwardSignal);
            }
            const cleanup = () => {
                for (const signal of signals) {
                    process.off(signal, forwardSignal);
                }
            };
            child.once("error", (error) => {
                cleanup();
                if (error.code === "ENOENT") {
                    reject(new CliError(`${request.targetName} command "${request.command}" was not found on PATH. Install it, then run "cc-byok launch ${request.targetId}" again.`, "TARGET_NOT_FOUND", 127, { cause: error }));
                    return;
                }
                reject(new CliError(`Could not launch ${request.targetName}: ${errorMessage(error)}`, "SPAWN_FAILED", 1, { cause: error }));
            });
            child.once("exit", (code, signal) => {
                cleanup();
                if (signal) {
                    resolve(128 + signalNumber(signal));
                    return;
                }
                resolve(code ?? 1);
            });
        });
    }
}
function signalNumber(signal) {
    return signal === "SIGINT" ? 2 : signal === "SIGTERM" ? 15 : 1;
}
//# sourceMappingURL=launcher.js.map