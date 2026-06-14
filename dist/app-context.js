import { FileConfigStore } from "./core/config.js";
import { ChildProcessLauncher } from "./core/launcher.js";
import { getAppPaths } from "./core/paths.js";
import { KeyringSecretStore } from "./core/secret-store.js";
import { InquirerPromptService } from "./ui/prompt.js";
export function createAppContext() {
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
        setExitCode(code) {
            process.exitCode = code;
        },
    };
}
//# sourceMappingURL=app-context.js.map