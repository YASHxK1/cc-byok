import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FileConfigStore } from "../src/core/config.js";
import { CliError } from "../src/core/errors.js";

const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("FileConfigStore", () => {
  it("initializes v3 config with Claude as the active target", async () => {
    const { store, configFile } = await fixture();
    const result = await store.initialize();

    expect(result.config).toMatchObject({
      version: 3,
      activeTarget: "claude",
      activeProvider: null,
      activeModel: null,
      targets: {},
      providers: {
        openrouter: { type: "anthropic-compatible" },
        vercel: { type: "ai-gateway" },
      },
    });
    expect(JSON.parse(await readFile(configFile, "utf8"))).toEqual(result.config);
  });

  it("migrates v2 config and preserves provider selection", async () => {
    const { store, configFile } = await fixture();
    await writeFile(
      configFile,
      JSON.stringify({
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
      }),
      "utf8",
    );

    const config = await store.read();
    expect(config).toMatchObject({
      version: 3,
      activeTarget: "claude",
      activeProvider: "openrouter",
      activeModel: "qwen/qwen3-coder",
      targets: {},
    });
    expect(config.providers.vercel).toMatchObject({
      baseUrl: "https://ai-gateway.vercel.sh",
      type: "ai-gateway",
    });
  });

  it("returns a repair-oriented error for malformed JSON", async () => {
    const { store, configFile } = await fixture();
    await writeFile(configFile, "{broken", "utf8");
    await expect(store.read()).rejects.toMatchObject<CliError>({
      code: "INVALID_CONFIG",
    });
  });
});

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "cc-byok-config-"));
  cleanup.push(directory);
  const configFile = join(directory, "config.json");
  return {
    configFile,
    store: new FileConfigStore({ configDir: directory, configFile }),
  };
}
