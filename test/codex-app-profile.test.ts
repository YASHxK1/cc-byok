import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  configureCodexAppProfile,
  updateCodexConfig,
} from "../src/core/codex-app-profile.js";

const cleanup: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanup.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("Codex App profile", () => {
  it("preserves unrelated config and replaces its managed provider block", () => {
    const first = updateCodexConfig(
      'model = "gpt-5.5"\n\n[projects."C:\\\\work"]\ntrust_level = "trusted"\n',
      values("first/model"),
    );
    const second = updateCodexConfig(first, values("second/model"));

    expect(second).toContain('model = "second/model"');
    expect(second).not.toContain('model = "first/model"');
    expect(second).toContain('[projects."C:\\\\work"]');
    expect(second).toContain('trust_level = "trusted"');
    expect(second.match(/# cc-byok:begin/g)).toHaveLength(1);
    expect(second.match(/\[model_providers\.cc_byok\]/g)).toHaveLength(1);
  });

  it("writes a catalog and one-time backup without persisting a key", async () => {
    const codexHome = await mkdtemp(join(tmpdir(), "cc-byok-profile-"));
    cleanup.push(codexHome);
    const configFile = join(codexHome, "config.toml");
    await writeFile(configFile, 'model = "gpt-5.5"\n');

    await configureCodexAppProfile({
      codexHome,
      providerId: "vercel",
      providerName: "Vercel AI Gateway",
      baseUrl: "https://ai-gateway.vercel.sh/v1",
      model: "deepseek/deepseek-v4-pro",
      credentialHelper: "C:\\cc-byok\\credential-helper.js",
    });

    const config = await readFile(configFile, "utf8");
    const backup = await readFile(
      join(codexHome, "config.toml.cc-byok.bak"),
      "utf8",
    );
    const catalog = await readFile(
      join(codexHome, "cc-byok-models.json"),
      "utf8",
    );

    expect(backup).toBe('model = "gpt-5.5"\n');
    expect(config).toContain("[model_providers.cc_byok.auth]");
    expect(config).toContain('"vercel"');
    expect(config).not.toContain("test-api-key");
    expect(catalog).toContain('"display_name": "deepseek/deepseek-v4-pro"');
  });
});

function values(model: string) {
  return {
    model,
    providerConfigId: "cc_byok",
    providerName: "Vercel AI Gateway",
    baseUrl: "https://ai-gateway.vercel.sh/v1",
    catalogFile: "C:\\Users\\test\\.codex\\cc-byok-models.json",
    credentialHelper: "C:\\cc-byok\\credential-helper.js",
    providerId: "vercel",
  };
}
