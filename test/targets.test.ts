import { describe, expect, it } from "vitest";
import { listTargets, resolveTarget } from "../src/core/target-registry.js";

describe("target registry", () => {
  it("registers the four supported targets", () => {
    expect(listTargets().map((target) => target.id)).toEqual([
      "claude",
      "codex",
      "codex-app",
      "opencode",
    ]);
    expect(resolveTarget("codex-app")).toMatchObject({
      command: "codex",
      protocol: "openai",
      defaultArgs: ["app"],
    });
    expect(resolveTarget("codex-app").argumentProfile).toBeUndefined();
    expect(resolveTarget("claude").restoreArgs).toEqual(["--continue"]);
    expect(resolveTarget("codex").restoreArgs).toEqual(["resume", "--last"]);
    expect(resolveTarget("codex-app").restoreArgs).toBeUndefined();
  });
});
