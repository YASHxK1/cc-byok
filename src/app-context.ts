import { FileConfigStore, type ConfigStore } from "./core/config.js";
import { ChildProcessLauncher, type ProcessLauncher } from "./core/launcher.js";
import { getAppPaths, type AppPaths } from "./core/paths.js";
import { KeyringSecretStore, type SecretStore } from "./core/secret-store.js";
import { InquirerPromptService, type PromptService } from "./ui/prompt.js";

export interface Output {
  log(message: string): void;
  error(message: string): void;
}

export interface AppContext {
  paths: AppPaths;
  config: ConfigStore;
  secrets: SecretStore;
  prompts: PromptService;
  launcher: ProcessLauncher;
  output: Output;
  cwd: string;
  env: NodeJS.ProcessEnv;
  fetch?: typeof fetch;
  setExitCode(code: number): void;
}

export function createAppContext(): AppContext {
  const paths = getAppPaths();
  return {
    paths,
    config: new FileConfigStore(paths),
    secrets: new KeyringSecretStore(),
    prompts: new InquirerPromptService(),
    launcher: new ChildProcessLauncher(),
    output: console,
    cwd: process.cwd(),
    env: process.env,
    fetch: globalThis.fetch,
    setExitCode(code) {
      process.exitCode = code;
    },
  };
}
