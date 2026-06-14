import { describe, expect, it } from "vitest";
import type { AppContext } from "../src/app-context.js";
import type { Config } from "../src/core/config-schema.js";
import type { LaunchRequest } from "../src/core/launcher.js";
import { createProgram, splitLaunchValues } from "../src/program.js";

describe("CLI argument parsing", () => {
  it("keeps legacy arguments after -- on the default target", () => {
    expect(splitLaunchValues(["--print", "hello"])).toEqual([
      undefined,
      ["--print", "hello"],
    ]);
  });

  it("separates an explicit target from target arguments", () => {
    expect(splitLaunchValues(["codex-app", "--help"])).toEqual([
      "codex-app",
      ["--help"],
    ]);
  });

  it("parses explicit target, provider, model, and forwarded arguments", async () => {
    let request: LaunchRequest | undefined;
    const config: Config = {
      version: 3,
      activeTarget: "claude",
      activeProvider: "openrouter",
      activeModel: "default-model",
      providers: {
        openrouter: {
          displayName: "OpenRouter",
          baseUrl: "https://openrouter.ai/api",
          type: "anthropic-compatible",
        },
        vercel: {
          displayName: "Vercel AI Gateway",
          baseUrl: "https://ai-gateway.vercel.sh",
          type: "ai-gateway",
        },
      },
      targets: {},
    };
    const context = fakeContext(config, (value) => {
      request = value;
    });

    await createProgram(context).parseAsync(
      [
        "node",
        "cc-byok",
        "launch",
        "codex",
        "--provider",
        "vercel",
        "--model",
        "openai/gpt-4.1",
        "--",
        "--help",
      ],
      { from: "node" },
    );

    expect(request).toMatchObject({
      targetId: "codex",
      env: {
        OPENAI_BASE_URL: "https://ai-gateway.vercel.sh/v1",
        OPENAI_MODEL: "openai/gpt-4.1",
      },
    });
    expect(request?.args).toContain('model="openai/gpt-4.1"');
    expect(request?.args).toContain('model_provider="cc_byok"');
    expect(request?.args.at(-1)).toBe("--help");
  });

  it("launches codex-app with vercel, deepseek model, and argument passthrough", async () => {
    let request: LaunchRequest | undefined;
    const config: Config = {
      version: 3,
      activeTarget: "claude",
      activeProvider: "openrouter",
      activeModel: "default-model",
      providers: {
        openrouter: {
          displayName: "OpenRouter",
          baseUrl: "https://openrouter.ai/api",
          type: "anthropic-compatible",
        },
        vercel: {
          displayName: "Vercel AI Gateway",
          baseUrl: "https://ai-gateway.vercel.sh",
          type: "ai-gateway",
        },
      },
      targets: {},
    };
    const context = fakeContext(config, (value) => {
      request = value;
    });

    await createProgram(context).parseAsync(
      [
        "node",
        "cc-byok",
        "launch",
        "codex-app",
        "--provider",
        "vercel",
        "--model",
        "deepseek/deepseek-v4-pro",
        "--",
        "/home/user/project",
      ],
      { from: "node" },
    );

    expect(request).toMatchObject({
      targetId: "codex-app",
      command: "codex",
      env: {
        OPENAI_BASE_URL: "https://ai-gateway.vercel.sh/v1",
        OPENAI_MODEL: "deepseek/deepseek-v4-pro",
      },
    });
    // defaultArgs "app" placed before codex routing args
    expect(request?.args[0]).toBe("app");
    expect(request?.args).toContain('model="deepseek/deepseek-v4-pro"');
    expect(request?.args).toContain('model_provider="cc_byok"');
    expect(request?.args.at(-1)).toBe("/home/user/project");
  });

  it("blocks incompatible provider/target pair unless forced", async () => {
    let request: LaunchRequest | undefined;
    const config: Config = {
      version: 3,
      activeTarget: "claude",
      activeProvider: "openrouter",
      activeModel: "default-model",
      providers: {
        vercel: {
          displayName: "Vercel AI Gateway",
          baseUrl: "https://ai-gateway.vercel.sh",
          type: "ai-gateway",
        },
      },
      targets: {},
    };
    const context = fakeContext(config, (value) => {
      request = value;
    });

    // codex-app is openai profile — vercel supports both anthropic and openai
    // so no mismatch. But an openai-only provider against the anthropic claude target
    // should fail.
    const anthropicOnlyContext = fakeContext(
      {
        ...config,
        providers: {
          ...config.providers,
          "openai-only": {
            displayName: "OpenAI GW",
            baseUrl: "https://openai.example/v1",
            type: "openai-compatible",
          },
        },
      },
      (value) => {
        request = value;
      },
    );

    await expect(
      createProgram(anthropicOnlyContext).parseAsync(
        [
          "node",
          "cc-byok",
          "launch",
          "claude",
          "--provider",
          "openai-only",
          "--model",
          "some-model",
        ],
        { from: "node" },
      ),
    ).rejects.toMatchObject({ code: "INCOMPATIBLE_TARGET" });

    // --force bypasses the check
    await createProgram(anthropicOnlyContext).parseAsync(
      [
        "node",
        "cc-byok",
        "launch",
        "claude",
        "--provider",
        "openai-only",
        "--model",
        "some-model",
        "--force",
      ],
      { from: "node" },
    );
    expect(request?.command).toBe("claude");
  });
});

function fakeContext(
  config: Config,
  capture: (request: LaunchRequest) => void,
): AppContext {
  return {
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
      customTarget: async () => ({
        id: "custom",
        name: "Custom",
        command: "custom",
        envProfile: "openai",
      }),
    },
    launcher: {
      launch: async (request) => {
        capture(request);
        return 0;
      },
    },
    output: { log: () => undefined, error: () => undefined },
    cwd: "/project",
    env: {},
    setExitCode: () => undefined,
  };
}
