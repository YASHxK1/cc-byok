import { describe, expect, it } from "vitest";
import type { Config } from "../src/core/config-schema.js";
import {
  isBuiltInTarget,
  listTargets,
  resolveTarget,
} from "../src/core/target-registry.js";

const config: Config = {
  version: 3,
  activeTarget: "claude",
  activeProvider: null,
  activeModel: null,
  providers: {},
  targets: {
    "my-agent": {
      id: "my-agent",
      name: "My Agent",
      command: "my-agent",
      envProfile: "openai",
      defaultArgs: [],
    },
  },
};

describe("target registry", () => {
  it("resolves every built-in and custom targets", () => {
    expect(
      ["claude", "codex", "codex-app", "opencode", "hermes", "openclaw"].map(
        (id) => resolveTarget(config, id).builtIn,
      ),
    ).toEqual([true, true, true, true, true, true]);
    expect(resolveTarget(config, "codex-app").target).toMatchObject({
      command: "codex",
      defaultArgs: ["app"],
    });
    expect(resolveTarget(config, "my-agent").builtIn).toBe(false);
    expect(listTargets(config)).toHaveLength(7);
  });

  it("keeps built-in target IDs reserved", () => {
    expect(isBuiltInTarget("claude")).toBe(true);
    expect(isBuiltInTarget("my-agent")).toBe(false);
  });
});
