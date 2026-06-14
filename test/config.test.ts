import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FileConfigStore } from "../src/core/config.js";
import { CliError } from "../src/core/errors.js";

const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("FileConfigStore", () => {
  it("initializes built-in gateways without selecting a model", async () => {
    const directory = await temporaryDirectory();
    const configFile = join(directory, "config.json");
    const store = new FileConfigStore({ configDir: directory, configFile });

    const result = await store.initialize();

    expect(result.created).toBe(true);
    expect(result.config).toEqual({
      version: 2,
      activeProvider: null,
      activeModel: null,
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
    });
    expect(JSON.parse(await readFile(configFile, "utf8"))).toEqual(result.config);
  });

  it("does not overwrite an existing valid config", async () => {
    const directory = await temporaryDirectory();
    const configFile = join(directory, "config.json");
    const store = new FileConfigStore({ configDir: directory, configFile });
    await store.initialize();
    const configured = {
      version: 2 as const,
      activeProvider: "openrouter",
      activeModel: "anthropic/claude-sonnet-4",
      providers: {
        openrouter: {
          displayName: "OpenRouter",
          baseUrl: "https://openrouter.ai/api",
          type: "anthropic-compatible" as const,
        },
        vercel: {
          displayName: "Vercel AI Gateway",
          baseUrl: "https://ai-gateway.vercel.sh",
          type: "anthropic-compatible" as const,
        },
      },
    };
    await store.write(configured);

    const result = await store.initialize();

    expect(result.created).toBe(false);
    expect(result.config).toEqual(configured);
  });

  it("migrates v1 OpenRouter config and adds Vercel AI Gateway", async () => {
    const directory = await temporaryDirectory();
    const configFile = join(directory, "config.json");
    await writeFile(
      configFile,
      JSON.stringify({
        version: 1,
        activeProvider: "openrouter",
        activeModel: "qwen/qwen3-coder",
        providers: {
          openrouter: { baseUrl: "https://openrouter.ai/api" },
        },
      }),
      "utf8",
    );
    const store = new FileConfigStore({ configDir: directory, configFile });

    const config = await store.read();

    expect(config.version).toBe(2);
    expect(config.activeModel).toBe("qwen/qwen3-coder");
    expect(config.providers.openrouter?.displayName).toBe("OpenRouter");
    expect(config.providers.vercel).toEqual({
      displayName: "Vercel AI Gateway",
      baseUrl: "https://ai-gateway.vercel.sh",
      type: "anthropic-compatible",
    });
  });

  it("returns a repair-oriented error for malformed JSON", async () => {
    const directory = await temporaryDirectory();
    const configFile = join(directory, "config.json");
    await writeFile(configFile, "{broken", "utf8");
    const store = new FileConfigStore({ configDir: directory, configFile });

    await expect(store.read()).rejects.toMatchObject<CliError>({
      code: "INVALID_CONFIG",
    });
  });

  it("loads and preserves config created by the v3 target launcher", async () => {
    const directory = await temporaryDirectory();
    const configFile = join(directory, "config.json");
    const original = {
      version: 3,
      activeTarget: "codex-app",
      activeProvider: "vercel",
      activeModel: "deepseek/deepseek-v4-pro",
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
    await writeFile(configFile, JSON.stringify(original), "utf8");
    const store = new FileConfigStore({ configDir: directory, configFile });

    const config = await store.read();
    await store.write(config);

    expect(config).toEqual(original);
    expect(JSON.parse(await readFile(configFile, "utf8"))).toEqual(original);
  });
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "cc-byok-test-"));
  cleanup.push(directory);
  return directory;
}
