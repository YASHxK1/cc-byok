import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access } from "node:fs/promises";
import { delimiter, extname, join } from "node:path";
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
    await ensureTargetAvailable(request);

    return new Promise<number>((resolve, reject) => {
      const child = spawn(request.command, request.args, {
        cwd: request.cwd,
        env: request.env,
        stdio: "inherit",
        shell: false,
      });

      const forwardSignal = (signal: NodeJS.Signals) => {
        if (!child.killed) {
          child.kill(signal);
        }
      };
      const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
      for (const signal of signals) {
        process.on(signal, forwardSignal);
      }

      const cleanup = () => {
        for (const signal of signals) {
          process.off(signal, forwardSignal);
        }
      };

      child.once("error", (error: NodeJS.ErrnoException) => {
        cleanup();
        if (error.code === "ENOENT") {
          reject(
            new CliError(
              targetNotFoundMessage(request),
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
        if (signal) {
          resolve(128 + signalNumber(signal));
          return;
        }
        resolve(code ?? 1);
      });
    });
  }
}

function signalNumber(signal: NodeJS.Signals): number {
  return signal === "SIGINT" ? 2 : signal === "SIGTERM" ? 15 : 1;
}

async function ensureTargetAvailable(request: LaunchRequest): Promise<void> {
  if (await findExecutable(request.command, request.env)) {
    return;
  }

  throw new CliError(targetNotFoundMessage(request), "TARGET_NOT_FOUND", 127);
}

async function findExecutable(
  command: string,
  env: NodeJS.ProcessEnv,
): Promise<string | null> {
  const path = getEnvValue(env, "PATH");
  if (!path) {
    return null;
  }

  for (const directory of path.split(delimiter).filter(Boolean)) {
    for (const candidate of executableCandidates(command, env)) {
      const resolved = join(directory, candidate);
      if (await canExecute(resolved)) {
        return resolved;
      }
    }
  }

  return null;
}

function executableCandidates(command: string, env: NodeJS.ProcessEnv): string[] {
  if (process.platform !== "win32") {
    return [command];
  }

  if (extname(command)) {
    return [command];
  }

  const extensions =
    getEnvValue(env, "PATHEXT") ?? ".COM;.EXE;.BAT;.CMD";
  return extensions
    .split(";")
    .filter(Boolean)
    .map((extension) => `${command}${extension.toLowerCase()}`);
}

async function canExecute(path: string): Promise<boolean> {
  try {
    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function getEnvValue(
  env: NodeJS.ProcessEnv,
  name: string,
): string | undefined {
  const exact = env[name];
  if (exact !== undefined || process.platform !== "win32") {
    return exact;
  }

  const key = Object.keys(env).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase(),
  );
  return key ? env[key] : undefined;
}

function targetNotFoundMessage(request: LaunchRequest): string {
  if (request.targetId === "claude") {
    return 'Claude Code was not found on PATH. Install Claude Code, verify "claude --version" works, then run "cc-byok launch" again.';
  }

  return `${request.targetName} command "${request.command}" was not found on PATH. Install it, verify "${request.command} --version" works, then run "cc-byok launch ${request.targetId}" again.`;
}
