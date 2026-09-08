import { describe, expect, it } from "vitest";
import { listTargets, resolveTarget } from "../src/core/target-registry.js";

describe("target registry", () => {
  it("registers the three supported targets", () => {
    expect(listTargets().map((target) => target.id)).toEqual([
      "claude",
      "codex",
      "chatgpt-app",
    ]);
    expect(resolveTarget("chatgpt-app")).toMatchObject({
      command: "chatgpt",
      protocol: "openai",
      defaultArgs: [],
    });
    expect(resolveTarget("chatgpt-app").argumentProfile).toBeUndefined();
    expect(resolveTarget("claude").restoreArgs).toEqual(["--continue"]);
    expect(resolveTarget("codex").restoreArgs).toEqual(["resume", "--last"]);
    expect(resolveTarget("chatgpt-app").restoreArgs).toEqual([]);
    expect(resolveTarget("codex-app")).toBe(resolveTarget("chatgpt-app"));
  });
});
