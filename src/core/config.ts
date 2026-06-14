import { constants } from "node:fs";
import {
  access,
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  type Config,
  configSchema,
  legacyConfigSchema,
} from "./config-schema.js";
import { CliError, errorMessage } from "./errors.js";
import type { AppPaths } from "./paths.js";
import { OPENROUTER } from "../providers/openrouter.js";
import { VERCEL_AI_GATEWAY } from "../providers/vercel-ai-gateway.js";

export interface ConfigStore {
  exists(): Promise<boolean>;
  initialize(): Promise<{ created: boolean; config: Config }>;
  read(): Promise<Config>;
  write(config: Config): Promise<void>;
}

export function createDefaultConfig(): Config {
  return {
    version: 2,
    activeProvider: null,
    activeModel: null,
    providers: {
      [OPENROUTER.id]: {
        displayName: OPENROUTER.displayName,
        baseUrl: OPENROUTER.defaultBaseUrl,
        type: "anthropic-compatible",
      },
      [VERCEL_AI_GATEWAY.id]: {
        displayName: VERCEL_AI_GATEWAY.displayName,
        baseUrl: VERCEL_AI_GATEWAY.defaultBaseUrl,
        type: "anthropic-compatible",
      },
    },
  };
}

export class FileConfigStore implements ConfigStore {
  constructor(private readonly paths: AppPaths) {}

  async exists(): Promise<boolean> {
    try {
      await access(this.paths.configFile, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<{ created: boolean; config: Config }> {
    if (await this.exists()) {
      const config = await this.read();
      await this.write(config);
      return { created: false, config };
    }

    const config = createDefaultConfig();
    await this.write(config);
    return { created: true, config };
  }

  async read(): Promise<Config> {
    let contents: string;
    try {
      contents = await readFile(this.paths.configFile, "utf8");
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "ENOENT") {
        throw new CliError(
          `cc-byok is not initialized. Run "cc-byok init".`,
          "NOT_INITIALIZED",
        );
      }
      throw new CliError(
        `Could not read config at ${this.paths.configFile}: ${errorMessage(error)}`,
        "INVALID_CONFIG",
        1,
        { cause: error },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(contents);
    } catch (error) {
      throw new CliError(
        `Config at ${this.paths.configFile} is not valid JSON. Repair it or move it aside and run "cc-byok init".`,
        "INVALID_CONFIG",
        1,
        { cause: error },
      );
    }

    const result = configSchema.safeParse(parsed);
    if (result.success) {
      return addMissingBuiltInProviders(result.data);
    }

    const legacyResult = legacyConfigSchema.safeParse(parsed);
    if (legacyResult.success) {
      return migrateLegacyConfig(legacyResult.data);
    }

    if (!result.success) {
      const issue = result.error.issues[0];
      const location = issue?.path.join(".") || "config";
      throw new CliError(
        `Config at ${this.paths.configFile} is invalid (${location}: ${issue?.message ?? "unknown error"}).`,
        "INVALID_CONFIG",
      );
    }

    throw new CliError(
      `Config at ${this.paths.configFile} is invalid.`,
      "INVALID_CONFIG",
    );
  }

  async write(config: Config): Promise<void> {
    const validated = configSchema.parse(config);
    const directory = dirname(this.paths.configFile);
    const tempFile = join(
      directory,
      `.${basename(this.paths.configFile)}.${randomUUID()}.tmp`,
    );

    await mkdir(directory, { recursive: true, mode: 0o700 });
    if (process.platform !== "win32") {
      await chmod(directory, 0o700);
    }

    try {
      await writeFile(tempFile, `${JSON.stringify(validated, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
        flag: "wx",
      });
      await rename(tempFile, this.paths.configFile);
      if (process.platform !== "win32") {
        await chmod(this.paths.configFile, 0o600);
      }
    } catch (error) {
      await rm(tempFile, { force: true }).catch(() => undefined);
      throw new CliError(
        `Could not write config at ${this.paths.configFile}: ${errorMessage(error)}`,
        "INVALID_CONFIG",
        1,
        { cause: error },
      );
    }
  }
}

function migrateLegacyConfig(
  legacy: ReturnType<typeof legacyConfigSchema.parse>,
): Config {
  const providers = Object.fromEntries(
    Object.entries(legacy.providers).map(([id, provider]) => [
      id,
      {
        displayName: id === OPENROUTER.id ? OPENROUTER.displayName : id,
        baseUrl: provider.baseUrl,
        type: "anthropic-compatible" as const,
      },
    ]),
  );

  return addMissingBuiltInProviders({
    version: 2,
    activeProvider: legacy.activeProvider,
    activeModel: legacy.activeModel,
    providers,
  });
}

function addMissingBuiltInProviders(config: Config): Config {
  return {
    ...config,
    providers: {
      [OPENROUTER.id]: {
        displayName: OPENROUTER.displayName,
        baseUrl: OPENROUTER.defaultBaseUrl,
        type: "anthropic-compatible",
      },
      [VERCEL_AI_GATEWAY.id]: {
        displayName: VERCEL_AI_GATEWAY.displayName,
        baseUrl: VERCEL_AI_GATEWAY.defaultBaseUrl,
        type: "anthropic-compatible",
      },
      ...config.providers,
    },
  };
}
