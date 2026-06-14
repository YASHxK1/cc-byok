import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { AppContext } from "../src/app-context.js";
import type { Config } from "../src/core/config-schema.js";
import type { LaunchRequest } from "../src/core/launcher.js";
import { createProgram, splitLaunchValues } from "../src/program.js";

describe("CLI argument parsing", () => {
  it("keeps arguments after -- on the default Claude target", () => {
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

  it("launches codex-app with Vercel and passes the model unchanged", async () => {
    const codexHome = await mkdtemp(join(tmpdir(), "cc-byok-codex-app-"));
    cleanup.push(codexHome);
    let request: LaunchRequest | undefined;
    const context = fakeContext(baseConfig(), (value) => {
      request = value;
    });
    context.env.CODEX_HOME = codexHome;

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
      targetName: "Codex App",
      command: "codex",
      env: {
        OPENAI_BASE_URL: "https://ai-gateway.vercel.sh/v1",
        OPENAI_API_KEY: "secret",
        OPENAI_MODEL: "deepseek/deepseek-v4-pro",
      },
    });
    expect(request?.args).toEqual(["app", "/home/user/project"]);
    expect(request?.args.at(-1)).toBe("/home/user/project");

    const codexConfig = await readFile(join(codexHome, "config.toml"), "utf8");
    const modelCatalog = await readFile(
      join(codexHome, "cc-byok-models.json"),
      "utf8",
    );
    expect(codexConfig).toContain('model = "deepseek/deepseek-v4-pro"');
    expect(codexConfig).toContain('model_provider = "cc_byok"');
    expect(codexConfig).toContain(
      'base_url = "https://ai-gateway.vercel.sh/v1"',
    );
    expect(codexConfig).toContain("[model_providers.cc_byok.auth]");
    expect(codexConfig).toContain('"vercel"');
    expect(codexConfig).not.toContain("secret");
    expect(modelCatalog).toContain('"slug": "deepseek/deepseek-v4-pro"');
  });

  it("rejects an Anthropic-only custom provider for codex-app", async () => {
    const config = baseConfig();
    config.providers["team-gateway"] = {
      displayName: "Team Gateway",
      baseUrl: "https://gateway.example.com",
      type: "anthropic-compatible",
    };

    await expect(
      createProgram(fakeContext(config, () => undefined)).parseAsync(
        [
          "node",
          "cc-byok",
          "launch",
          "codex-app",
          "--provider",
          "team-gateway",
          "--model",
          "any/model-id",
        ],
        { from: "node" },
      ),
    ).rejects.toMatchObject({ code: "INCOMPATIBLE_TARGET" });
  });

  it("rejects unknown targets before launching", async () => {
    await expect(
      createProgram(fakeContext(baseConfig(), () => undefined)).parseAsync(
        ["node", "cc-byok", "launch", "not-a-target"],
        { from: "node" },
      ),
    ).rejects.toMatchObject({ code: "UNKNOWN_TARGET" });
  });

  it("uses the legacy active provider and model for bare launch", async () => {
    let request: LaunchRequest | undefined;
    const context = fakeContext(baseConfig(), (value) => {
      request = value;
    });

    await createProgram(context).parseAsync(
      ["node", "cc-byok", "launch", "--", "--print", "hello"],
      { from: "node" },
    );

    expect(request).toMatchObject({
      targetId: "claude",
      command: "claude",
      args: ["--print", "hello"],
      env: {
        ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
        ANTHROPIC_MODEL: "qwen/qwen3-coder",
      },
    });
  });

  it("reports a missing provider key for an explicit target", async () => {
    const context = fakeContext(baseConfig(), () => undefined);
    context.secrets.get = async () => null;

    await expect(
      createProgram(context).parseAsync(
        [
          "node",
          "cc-byok",
          "launch",
          "codex",
          "--provider",
          "vercel",
          "--model",
          "openai/gpt-5",
        ],
        { from: "node" },
      ),
    ).rejects.toMatchObject({ code: "MISSING_KEY" });
  });
});

const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

function baseConfig(): Config {
  return {
    version: 2,
    activeProvider: "openrouter",
    activeModel: "qwen/qwen3-coder",
    providers: {
      openrouter: {
        displayName: "OpenRouter",
        baseUrl: "https://openrouter.ai/api",
        type: "anthropic-compatible",
      },
      vercel: {
        displayName: "Vercel AI Gateway",
        baseUrl: "https://ai-gateway.vercel.sh",
        type: "anthropic-compatible",
      },
    },
  };
}

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
