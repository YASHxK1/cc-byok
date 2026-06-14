import { spawn } from "node:child_process";
import { CliError, errorMessage } from "./errors.js";

export interface LaunchRequest {
  targetId: string;
  targetName: string;
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
}

export interface ProcessLauncher {
  launch(request: LaunchRequest): Promise<number>;
}

export class ChildProcessLauncher implements ProcessLauncher {
  async launch(request: LaunchRequest): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      const child = spawn(request.command, request.args, {
        cwd: request.cwd,
        env: request.env,
        stdio: "inherit",
        shell: false,
      });

      const forwardSignal = (signal: NodeJS.Signals) => {
        if (!child.killed) child.kill(signal);
      };
      const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
      for (const signal of signals) process.on(signal, forwardSignal);

      const cleanup = () => {
        for (const signal of signals) process.off(signal, forwardSignal);
      };

      child.once("error", (error: NodeJS.ErrnoException) => {
        cleanup();
        if (error.code === "ENOENT") {
          reject(
            new CliError(
              `${request.targetName} command "${request.command}" was not found on PATH. Install it, then run "cc-byok launch ${request.targetId}" again.`,
              "TARGET_NOT_FOUND",
              127,
              { cause: error },
            ),
          );
          return;
        }
        reject(
          new CliError(
            `Could not launch ${request.targetName}: ${errorMessage(error)}`,
            "SPAWN_FAILED",
            1,
            { cause: error },
          ),
        );
      });

      child.once("exit", (code, signal) => {
        cleanup();
        resolve(signal ? 128 + signalNumber(signal) : (code ?? 1));
      });
    });
  }
}

function signalNumber(signal: NodeJS.Signals): number {
  return signal === "SIGINT" ? 2 : signal === "SIGTERM" ? 15 : 1;
}
