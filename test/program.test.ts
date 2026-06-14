import { describe, expect, it } from "vitest";
import type { AppContext } from "../src/app-context.js";
import type { Config } from "../src/core/config-schema.js";
import type { LaunchRequest } from "../src/core/launcher.js";
import { createProgram } from "../src/program.js";

describe("CLI argument parsing", () => {
  it("forwards arguments after launch to Claude Code", async () => {
    let launchRequest: LaunchRequest | undefined;
    const config: Config = {
      version: 2,
      activeProvider: "openrouter",
      activeModel: "qwen/qwen3-coder",
      providers: {
        openrouter: {
          displayName: "OpenRouter",
          baseUrl: "https://openrouter.ai/api",
          type: "anthropic-compatible",
        },
      },
    };
    const context: AppContext = {
      paths: { configDir: "/config", configFile: "/config/config.json" },
      config: {
        exists: async () => true,
        initialize: async () => ({ created: false, config }),
        read: async () => config,
        write: async () => undefined,
      },
      secrets: {
        get: async () => "secret",
        has: async () => true,
        set: async () => undefined,
      },
      prompts: {
        apiKey: async () => "secret",
        confirmReplace: async () => true,
      },
      launcher: {
        launch: async (request) => {
          launchRequest = request;
          return 0;
        },
      },
      output: { log: () => undefined, error: () => undefined },
      cwd: "/project",
      env: {},
      setExitCode: () => undefined,
    };

    await createProgram(context).parseAsync(
      ["node", "cc-byok", "launch", "--", "--print", "hello"],
      { from: "node" },
    );

    expect(launchRequest?.args).toEqual(["--print", "hello"]);
  });
});
