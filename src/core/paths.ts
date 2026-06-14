import { homedir } from "node:os";
import { join, resolve } from "node:path";

export interface AppPaths {
  configDir: string;
  configFile: string;
}

export function getAppPaths(env: NodeJS.ProcessEnv = process.env): AppPaths {
  const configDir = env.CC_BYOK_HOME
    ? resolve(env.CC_BYOK_HOME)
    : join(homedir(), ".cc-byok");

  return {
    configDir,
    configFile: join(configDir, "config.json"),
  };
}
