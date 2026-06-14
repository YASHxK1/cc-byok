import { describe, expect, it } from "vitest";
import { ChildProcessLauncher } from "../src/core/launcher.js";

describe("ChildProcessLauncher", () => {
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
