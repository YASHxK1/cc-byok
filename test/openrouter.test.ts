import { describe, expect, it } from "vitest";
import { OPENROUTER } from "../src/providers/openrouter.js";

describe("OpenRouter provider", () => {
  it("builds the exact Claude Code routing environment", () => {
    expect(
      OPENROUTER.buildEnvironment({
        baseUrl: "https://openrouter.ai/api",
        apiKey: "secret-value",
        model: "qwen/qwen3-coder",
      }),
    ).toEqual({
      ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
      ANTHROPIC_AUTH_TOKEN: "secret-value",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "qwen/qwen3-coder",
    });
  });
});
