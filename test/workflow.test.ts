import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { AppContext } from "../src/app-context.js";
import { runInit } from "../src/commands/init.js";
import { runLaunch } from "../src/commands/launch.js";
import { runProviderAdd } from "../src/commands/provider-add.js";
import { runProviderList } from "../src/commands/provider-list.js";
import { runStatus } from "../src/commands/status.js";
import { runUse } from "../src/commands/use.js";
import { FileConfigStore } from "../src/core/config.js";
import type { LaunchRequest, ProcessLauncher } from "../src/core/launcher.js";
import type { SecretStore } from "../src/core/secret-store.js";
import type { PromptService } from "../src/ui/prompt.js";

const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("MVP workflow", () => {
  it("initializes, stores a key, selects a model, reports status, and launches", async () => {
    const fixture = await createFixture();

    await runInit(fixture.context);
    await runProviderAdd(fixture.context, "openrouter");
    await runUse(fixture.context, "openrouter", "qwen/qwen3-coder");
    await runProviderList(fixture.context);
    await runStatus(fixture.context);
    await runLaunch(fixture.context, undefined, ["--print", "hello"]);

    expect(fixture.secrets.values.get("openrouter")).toBe("test-api-key");
    expect(fixture.launcher.request?.args).toEqual(["--print", "hello"]);
    expect(fixture.launcher.request?.cwd).toBe("C:\\project");
    expect(fixture.launcher.request?.env).toMatchObject({
      EXISTING_VARIABLE: "preserved",
      ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
      ANTHROPIC_AUTH_TOKEN: "test-api-key",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "qwen/qwen3-coder",
    });
    expect(fixture.exitCodes).toEqual([23]);
    expect(fixture.logs.join("\n")).toContain("API key: stored");
    expect(fixture.logs.join("\n")).not.toContain("test-api-key");
    expect(fixture.errors).toEqual([]);
  });

  it("overrides an inherited Anthropic API key with an empty string", async () => {
    const fixture = await createFixture({
      env: {
        EXISTING_VARIABLE: "preserved",
        ANTHROPIC_API_KEY: "inherited-anthropic-key",
      },
    });

    await runInit(fixture.context);
    await runProviderAdd(fixture.context, "openrouter");
    await runUse(fixture.context, "openrouter", "qwen/qwen3-coder");
    await runLaunch(fixture.context, undefined, []);

    expect(fixture.launcher.request?.env.ANTHROPIC_API_KEY).toBe("");
    expect(fixture.logs.join("\n")).not.toContain("test-api-key");
    expect(fixture.logs.join("\n")).not.toContain("inherited-anthropic-key");
    expect(fixture.errors.join("\n")).not.toContain("test-api-key");
  });

  it("restores Claude Code without changing BYOK environment or logging keys", async () => {
    const fixture = await createFixture();

    await runInit(fixture.context);
    await runProviderAdd(fixture.context, "openrouter");
    await runUse(fixture.context, "openrouter", "qwen/qwen3-coder");
    await runLaunch(fixture.context, undefined, [], { restore: true });

    expect(fixture.launcher.request?.args).toEqual(["--continue"]);
    expect(fixture.launcher.request?.env).toMatchObject({
      ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
      ANTHROPIC_AUTH_TOKEN: "test-api-key",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "qwen/qwen3-coder",
    });
    expect(fixture.logs.join("\n")).not.toContain("test-api-key");
    expect(fixture.errors.join("\n")).not.toContain("test-api-key");
  });

  it("does not overwrite a stored key when replacement is declined", async () => {
    const fixture = await createFixture();
    await runInit(fixture.context);
    fixture.secrets.values.set("openrouter", "original-key");
    fixture.prompts.replace = false;

    await expect(
      runProviderAdd(fixture.context, "openrouter"),
    ).rejects.toMatchObject({ code: "CANCELLED", exitCode: 0 });
    expect(fixture.secrets.values.get("openrouter")).toBe("original-key");
  });

  it("refuses to launch before a model is selected", async () => {
    const fixture = await createFixture();
    await runInit(fixture.context);

    await expect(runLaunch(fixture.context, undefined, [])).rejects.toMatchObject({
      code: "MISSING_PROVIDER",
    });
    expect(fixture.launcher.request).toBeNull();
  });

  it("refuses to launch when a provider is selected without a model", async () => {
    const fixture = await createFixture();
    await runInit(fixture.context);
    const config = await fixture.context.config.read();
    await fixture.context.config.write({
      ...config,
      activeProvider: "openrouter",
      activeModel: null,
    });

    await expect(runLaunch(fixture.context, undefined, [])).rejects.toThrow(
      'Run "cc-byok use openrouter <model-id>"',
    );
    await expect(runLaunch(fixture.context, undefined, [])).rejects.toMatchObject({
      code: "MISSING_MODEL",
    });
    expect(fixture.launcher.request).toBeNull();
  });

  it("refuses to launch before spawning when the provider key is missing", async () => {
    const fixture = await createFixture();
    await runInit(fixture.context);
    await runUse(fixture.context, "openrouter", "qwen/qwen3-coder");

    await expect(runLaunch(fixture.context, undefined, [])).rejects.toMatchObject({
      code: "MISSING_KEY",
      message: expect.stringContaining(
        'Run "cc-byok provider add openrouter".',
      ),
    });
    expect(fixture.launcher.request).toBeNull();
  });

  it("adds and launches a custom Anthropic-compatible gateway", async () => {
    const fixture = await createFixture();
    await runInit(fixture.context);

    await runProviderAdd(fixture.context, "team-gateway", {
      baseUrl: "https://gateway.example.com/",
      displayName: "Team Gateway",
    });
    await runUse(
      fixture.context,
      "team-gateway",
      "anthropic/claude-sonnet-4.6",
    );
    await runLaunch(fixture.context, undefined, []);

    const config = await fixture.context.config.read();
    expect(config.providers["team-gateway"]).toEqual({
      displayName: "Team Gateway",
      baseUrl: "https://gateway.example.com",
      type: "anthropic-compatible",
    });
    expect(fixture.launcher.request?.env).toMatchObject({
      ANTHROPIC_BASE_URL: "https://gateway.example.com",
      ANTHROPIC_AUTH_TOKEN: "test-api-key",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "anthropic/claude-sonnet-4.6",
    });
  });

  it("configures the built-in Vercel AI Gateway", async () => {
    const fixture = await createFixture();
    await runInit(fixture.context);

    await runProviderAdd(fixture.context, "vercel");
    await runUse(
      fixture.context,
      "vercel",
      "anthropic/claude-sonnet-4.6",
    );
    await runLaunch(fixture.context, undefined, []);

    expect(fixture.launcher.request?.env).toMatchObject({
      ANTHROPIC_BASE_URL: "https://ai-gateway.vercel.sh",
      ANTHROPIC_AUTH_TOKEN: "test-api-key",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "anthropic/claude-sonnet-4.6",
    });
  });

  it("launches OpenCode through the local AI Gateway", async () => {
    const fixture = await createFixture();
    await runInit(fixture.context);

    await runProviderAdd(fixture.context, "ai-gateway");
    await runUse(fixture.context, "ai-gateway", "codex-latest");
    await runLaunch(fixture.context, "opencode", []);

    expect(fixture.launcher.request?.env).toMatchObject({
      OPENAI_BASE_URL: "http://127.0.0.1:3000/v1",
      OPENAI_API_KEY: fixture.secrets.values.get("ai-gateway"),
      OPENAI_MODEL: "codex-latest",
    });
    expect(fixture.secrets.values.get("ai-gateway")).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("launches Claude through the local Anthropic-compatible AI Gateway", async () => {
    const fixture = await createFixture(); await runInit(fixture.context);
    let healthUrl = "";
    fixture.context.fetch = async (input) => { healthUrl = String(input); return new Response(null, { status: 200 }); };
    await runProviderAdd(fixture.context, "ai-gateway"); await runUse(fixture.context, "ai-gateway", "codex-latest");
    await runLaunch(fixture.context, "claude", []);
    expect(healthUrl).toBe("http://127.0.0.1:3000/v1/status");
    expect(fixture.launcher.request?.env).toMatchObject({
      ANTHROPIC_BASE_URL: "http://127.0.0.1:3000",
      ANTHROPIC_AUTH_TOKEN: fixture.secrets.values.get("ai-gateway"),
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "codex-latest",
    });
  });

  it("rejects the local AI Gateway for Codex Responses targets", async () => {
    const fixture = await createFixture();
    await runInit(fixture.context);
    await runProviderAdd(fixture.context, "ai-gateway");

    await expect(
      runLaunch(fixture.context, "codex", [], {
        provider: "ai-gateway",
        model: "codex-latest",
      }),
    ).rejects.toMatchObject({ code: "INCOMPATIBLE_TARGET" });
    expect(fixture.launcher.request).toBeNull();
  });
});

class MemorySecretStore implements SecretStore {
  readonly values = new Map<string, string>();

  async get(provider: string): Promise<string | null> {
    return this.values.get(provider) ?? null;
  }

  async has(provider: string): Promise<boolean> {
    return this.values.has(provider);
  }

  async set(provider: string, apiKey: string): Promise<void> {
    this.values.set(provider, apiKey);
  }
}

class FakePrompts implements PromptService {
  replace = true;

  async apiKey(): Promise<string> {
    return "test-api-key";
  }

  async confirmReplace(): Promise<boolean> {
    return this.replace;
  }
}

class CapturingLauncher implements ProcessLauncher {
  request: LaunchRequest | null = null;

  async launch(request: LaunchRequest): Promise<number> {
    this.request = request;
    return 23;
  }
}

async function createFixture(options: { env?: NodeJS.ProcessEnv } = {}) {
  const directory = await mkdtemp(join(tmpdir(), "cc-byok-workflow-"));
  cleanup.push(directory);
  const paths = {
    configDir: directory,
    configFile: join(directory, "config.json"),
  };
  const secrets = new MemorySecretStore();
  const prompts = new FakePrompts();
  const launcher = new CapturingLauncher();
  const logs: string[] = [];
  const errors: string[] = [];
  const exitCodes: number[] = [];
  const context: AppContext = {
    paths,
    config: new FileConfigStore(paths),
    secrets,
    prompts,
    launcher,
    output: {
      log: (message) => logs.push(message),
      error: (message) => errors.push(message),
    },
    cwd: "C:\\project",
    env: options.env ?? { EXISTING_VARIABLE: "preserved" },
    setExitCode: (code) => exitCodes.push(code),
  };

  return {
    context,
    secrets,
    prompts,
    launcher,
    logs,
    errors,
    exitCodes,
  };
}
