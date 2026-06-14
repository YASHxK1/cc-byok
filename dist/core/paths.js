import { homedir } from "node:os";
import { join, resolve } from "node:path";
export function getAppPaths(env = process.env) {
    const configDir = env.CC_BYOK_HOME
        ? resolve(env.CC_BYOK_HOME)
        : join(homedir(), ".cc-byok");
    return {
        configDir,
        configFile: join(configDir, "config.json"),
    };
}
//# sourceMappingURL=paths.js.map