import { type ConfigStore } from "./core/config.js";
import { type ProcessLauncher } from "./core/launcher.js";
import { type AppPaths } from "./core/paths.js";
import { type SecretStore } from "./core/secret-store.js";
import { type PromptService } from "./ui/prompt.js";
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
export declare function createAppContext(): AppContext;
