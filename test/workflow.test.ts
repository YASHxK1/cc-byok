import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { AppContext } from "../src/app-context.js";
import { runLaunch } from "../src/commands/launch.js";
import { runProviderAdd } from "../src/commands/provider-add.js";
import { runStatus } from "../src/commands/status.js";
import { runTargetsAdd } from "../src/commands/targets-add.js";
import { runTargetsRemove } from "../src/commands/targets-remove.js";
import { FileConfigStore } from "../src/core/config.js";
import type { LaunchRequest, ProcessLauncher } from "../src/core/launcher.js";
import type { SecretStore } from "../src/core/secret-store.js";
import type { NewTarget, PromptService } from "../src/ui/prompt.js";

const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("launch target workflow", () => {
  it("preserves the default Claude/OpenRouter behavior", async () => {
    const fixture = await createFixture();
    await fixture.context.config.initialize();
    await runProviderAdd(fixture.context, "openrouter");
    const config = await fixture.context.config.read();
    await fixture.context.config.write({
      ...config,
      activeProvider: "openrouter",
      activeModel: "qwen/qwen3-coder",
    });

    await runLaunch(fixture.context, undefined, ["--print", "hello"]);

    expect(fixture.launcher.request).toMatchObject({
      targetId: "claude",
      command: "claude",
      args: ["--print", "hello"],
      cwd: "C:\\project",
    });
    expect(fixture.launcher.request?.env).toMatchObject({
      EXISTING_VARIABLE: "preserved",
      ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
      ANTHROPIC_AUTH_TOKEN: "test-api-key",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "qwen/qwen3-coder",
    });
    expect(fixture.exitCodes).toEqual([23]);
  });

  it("launches an explicit target with session overrides and persists the target", async () => {
    const fixture = await createFixture();
    await fixture.context.config.initialize();
    await runProviderAdd(fixture.context, "vercel");

    await runLaunch(fixture.context, "codex", ["--help"], {
      provider: "vercel",
      model: "openai/gpt-4.1",
    });

    expect(fixture.launcher.request).toMatchObject({
      targetId: "codex",
      command: "codex",
    });
    expect(fixture.launcher.request?.args).toEqual([
      "-c",
      'model="openai/gpt-4.1"',
      "-c",
      'model_provider="cc_byok"',
      "-c",
      'model_providers.cc_byok.name="Vercel AI Gateway"',
      "-c",
      'model_providers.cc_byok.base_url="https://ai-gateway.vercel.sh/v1"',
      "-c",
      'model_providers.cc_byok.env_key="OPENAI_API_KEY"',
      "-c",
      'model_providers.cc_byok.wire_api="responses"',
      "--help",
    ]);
    expect(fixture.launcher.request?.env).toMatchObject({
      OPENAI_BASE_URL: "https://ai-gateway.vercel.sh/v1",
      OPENAI_API_KEY: "test-api-key",
      OPENAI_MODEL: "openai/gpt-4.1",
    });
    const config = await fixture.context.config.read();
    expect(config.activeTarget).toBe("codex");
    expect(config.activeProvider).toBeNull();
    expect(config.activeModel).toBeNull();
  });

  it("blocks known mismatches unless force is supplied", async () => {
    const fixture = await createFixture();
    await fixture.context.config.initialize();
    await runProviderAdd(fixture.context, "openai-only", {
      baseUrl: "https://openai.example/v1",
      type: "openai-compatible",
    });

    await expect(
      runLaunch(fixture.context, "claude", [], {
        provider: "openai-only",
        model: "qwen3",
      }),
    ).rejects.toMatchObject({ code: "INCOMPATIBLE_TARGET" });

    await runLaunch(fixture.context, "claude", [], {
      provider: "openai-only",
      model: "qwen3",
      force: true,
    });
    expect(fixture.errors.join("\n")).toContain("Warning:");
  });

  it("configures an Ollama provider without prompting for or storing a key", async () => {
    const fixture = await createFixture();
    await fixture.context.config.initialize();
    fixture.prompts.failOnApiKey = true;

    await runProviderAdd(fixture.context, "ollama-local", {
      baseUrl: "http://localhost:11434",
      type: "ollama",
    });

    expect(fixture.secrets.values.has("ollama-local")).toBe(false);
    expect(
      (await fixture.context.config.read()).providers["ollama-local"],
    ).toMatchObject({ type: "ollama", baseUrl: "http://localhost:11434" });
  });

  it("adds, loads, and removes a custom target but protects built-ins", async () => {
    const fixture = await createFixture();
    await fixture.context.config.initialize();
    fixture.prompts.target = {
      id: "my-agent",
      name: "My Agent",
      command: "my-agent",
      envProfile: "custom",
      customEnvMapping: { model: "MY_MODEL" },
    };

    await runTargetsAdd(fixture.context);
    expect((await fixture.context.config.read()).targets["my-agent"]).toMatchObject({
      command: "my-agent",
      envProfile: "custom",
    });
    await runTargetsRemove(fixture.context, "my-agent");
    expect((await fixture.context.config.read()).targets["my-agent"]).toBeUndefined();
    await expect(
      runTargetsRemove(fixture.context, "claude"),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("launches codex-app with vercel and deepseek model passthrough", async () => {
    const fixture = await createFixture();
    await fixture.context.config.initialize();
    await runProviderAdd(fixture.context, "vercel");

    await runLaunch(fixture.context, "codex-app", ["E:\\project"], {
      provider: "vercel",
      model: "deepseek/deepseek-v4-pro",
    });

    expect(fixture.launcher.request).toMatchObject({
      targetId: "codex-app",
      command: "codex",
    });
    // defaultArgs "app" must be first
    expect(fixture.launcher.request?.args[0]).toBe("app");
    expect(fixture.launcher.request?.args).toContain(
      'model="deepseek/deepseek-v4-pro"',
    );
    expect(fixture.launcher.request?.args).toContain(
      'model_provider="cc_byok"',
    );
    expect(fixture.launcher.request?.args).toContain(
      'model_providers.cc_byok.base_url="https://ai-gateway.vercel.sh/v1"',
    );
    expect(fixture.launcher.request?.args).toContain(
      'model_providers.cc_byok.env_key="OPENAI_API_KEY"',
    );
    expect(fixture.launcher.request?.args).toContain(
      'model_providers.cc_byok.wire_api="responses"',
    );
    expect(fixture.launcher.request?.args.at(-1)).toBe("E:\\project");
    expect(fixture.launcher.request?.env).toMatchObject({
      OPENAI_BASE_URL: "https://ai-gateway.vercel.sh/v1",
      OPENAI_API_KEY: "test-api-key",
      OPENAI_MODEL: "deepseek/deepseek-v4-pro",
    });
    const config = await fixture.context.config.read();
    expect(config.activeTarget).toBe("codex-app");
  });

  it("shows masked status without reading the key", async () => {
    const fixture = await createFixture();
    await fixture.context.config.initialize();
    const config = await fixture.context.config.read();
    await fixture.context.config.write({
      ...config,
      activeProvider: "vercel",
      activeModel: "openai/gpt-4.1",
      activeTarget: "codex",
    });
    fixture.secrets.failOnRead = true;

    await runStatus(fixture.context);
    expect(fixture.logs.join("\n")).toContain("API key: ************");
    expect(fixture.logs.join("\n")).toContain(
      "Base URL: https://ai-gateway.vercel.sh/v1",
    );
  });
});

class MemorySecretStore implements SecretStore {
  readonly values = new Map<string, string>();
  failOnRead = false;

  async get(provider: string): Promise<string | null> {
    if (this.failOnRead) throw new Error("key should not be read");
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
  failOnApiKey = false;
  target: NewTarget = {
    id: "my-agent",
    name: "My Agent",
    command: "my-agent",
    envProfile: "openai",
  };
  async apiKey(): Promise<string> {
    if (this.failOnApiKey) throw new Error("API key prompt should not run");
    return "test-api-key";
  }
  async confirmReplace(): Promise<boolean> {
    return true;
  }
  async customTarget(): Promise<NewTarget> {
    return this.target;
  }
}

class CapturingLauncher implements ProcessLauncher {
  request: LaunchRequest | null = null;
  async launch(request: LaunchRequest): Promise<number> {
    this.request = request;
    return 23;
  }
}

async function createFixture() {
  const directory = await mkdtemp(join(tmpdir(), "cc-byok-workflow-"));
  cleanup.push(directory);
  const paths = { configDir: directory, configFile: join(directory, "config.json") };
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
    env: { EXISTING_VARIABLE: "preserved" },
    setExitCode: (code) => exitCodes.push(code),
  };
  return { context, secrets, prompts, launcher, logs, errors, exitCodes };
}
