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
  it("initializes a versioned OpenRouter config without selecting a model", async () => {
    const directory = await temporaryDirectory();
    const configFile = join(directory, "config.json");
    const store = new FileConfigStore({ configDir: directory, configFile });

    const result = await store.initialize();

    expect(result.created).toBe(true);
    expect(result.config).toEqual({
      version: 1,
      activeProvider: null,
      activeModel: null,
      providers: {
        openrouter: { baseUrl: "https://openrouter.ai/api" },
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
      version: 1 as const,
      activeProvider: "openrouter",
      activeModel: "anthropic/claude-sonnet-4",
      providers: {
        openrouter: { baseUrl: "https://openrouter.ai/api" },
      },
    };
    await store.write(configured);

    const result = await store.initialize();

    expect(result.created).toBe(false);
    expect(result.config).toEqual(configured);
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
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "cc-byok-test-"));
  cleanup.push(directory);
  return directory;
}
