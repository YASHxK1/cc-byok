import { describe, expect, it } from "vitest";
import { OPENROUTER } from "../src/providers/openrouter.js";
import { VERCEL_AI_GATEWAY } from "../src/providers/vercel-ai-gateway.js";

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

describe("Vercel AI Gateway provider", () => {
  it("uses Vercel's Anthropic Messages endpoint", () => {
    expect(VERCEL_AI_GATEWAY.defaultBaseUrl).toBe(
      "https://ai-gateway.vercel.sh",
    );
    expect(
      VERCEL_AI_GATEWAY.buildEnvironment({
        baseUrl: VERCEL_AI_GATEWAY.defaultBaseUrl,
        apiKey: "vercel-secret",
        model: "anthropic/claude-sonnet-4.6",
      }),
    ).toEqual({
      ANTHROPIC_BASE_URL: "https://ai-gateway.vercel.sh",
      ANTHROPIC_AUTH_TOKEN: "vercel-secret",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "anthropic/claude-sonnet-4.6",
    });
  });
});
