import { describe, expect, it } from "vitest";
import { ChildProcessLauncher } from "../src/core/launcher.js";

describe("ChildProcessLauncher", () => {
  it("fails before spawning with Claude-specific guidance when Claude Code is missing", async () => {
    const launcher = new ChildProcessLauncher();

    await expect(
      launcher.launch({
        targetId: "claude",
        targetName: "Claude Code",
        command: "claude",
        args: [],
        cwd: process.cwd(),
        env: { PATH: "" },
      }),
    ).rejects.toMatchObject({
      code: "TARGET_NOT_FOUND",
      exitCode: 127,
      message: expect.stringContaining("claude --version"),
    });
  });

  it("returns a target-specific error for a missing executable", async () => {
    const launcher = new ChildProcessLauncher();

    await expect(
      launcher.launch({
        targetId: "missing-agent",
        targetName: "Missing Agent",
        command: "cc-byok-command-that-does-not-exist",
        args: [],
        cwd: process.cwd(),
        env: process.env,
      }),
    ).rejects.toMatchObject({
      code: "TARGET_NOT_FOUND",
      exitCode: 127,
    });
  });
});
