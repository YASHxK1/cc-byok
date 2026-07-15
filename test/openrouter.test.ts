import { describe, expect, it } from "vitest";
import { buildTargetEnvironment } from "../src/core/env-builder.js";
import { OPENROUTER } from "../src/providers/openrouter.js";
import { VERCEL_AI_GATEWAY } from "../src/providers/vercel-ai-gateway.js";
import { AI_GATEWAY } from "../src/providers/ai-gateway.js";

describe("target environment builder", () => {
  it("builds the Claude environment", () => {
    expect(
      buildTargetEnvironment({
        baseUrl: "https://openrouter.ai/api",
        apiKey: "secret-value",
        model: "qwen/qwen3-coder",
        protocol: "anthropic",
      }),
    ).toEqual({
      ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
      ANTHROPIC_AUTH_TOKEN: "secret-value",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "qwen/qwen3-coder",
    });
  });

  it("passes OpenAI-compatible model IDs through unchanged", () => {
    expect(
      buildTargetEnvironment({
        baseUrl: "https://ai-gateway.vercel.sh/v1",
        apiKey: "vercel-secret",
        model: "deepseek/deepseek-v4-pro",
        protocol: "openai",
      }),
    ).toEqual({
      OPENAI_BASE_URL: "https://ai-gateway.vercel.sh/v1",
      OPENAI_API_KEY: "vercel-secret",
      OPENAI_MODEL: "deepseek/deepseek-v4-pro",
    });
  });
});

describe("built-in provider endpoints", () => {
  it("resolves protocol-specific OpenRouter and Vercel endpoints", () => {
    expect(
      OPENROUTER.resolveBaseUrl(OPENROUTER.defaultBaseUrl, "anthropic"),
    ).toBe("https://openrouter.ai/api");
    expect(
      OPENROUTER.resolveBaseUrl(OPENROUTER.defaultBaseUrl, "openai"),
    ).toBe("https://openrouter.ai/api/v1");
    expect(
      VERCEL_AI_GATEWAY.resolveBaseUrl(
        VERCEL_AI_GATEWAY.defaultBaseUrl,
        "anthropic",
      ),
    ).toBe("https://ai-gateway.vercel.sh");
    expect(
      VERCEL_AI_GATEWAY.resolveBaseUrl(
        VERCEL_AI_GATEWAY.defaultBaseUrl,
        "openai",
      ),
    ).toBe("https://ai-gateway.vercel.sh/v1");
  });

  it("registers the local AI Gateway Anthropic and chat-completions endpoints", () => {
    expect(AI_GATEWAY.defaultBaseUrl).toBe("http://127.0.0.1:3000/v1");
    expect(AI_GATEWAY.supportedProtocols).toEqual(["anthropic", "openai-chat"]);
    expect(
      AI_GATEWAY.resolveBaseUrl(AI_GATEWAY.defaultBaseUrl, "openai-chat"),
    ).toBe("http://127.0.0.1:3000/v1");
    expect(
      AI_GATEWAY.resolveBaseUrl(AI_GATEWAY.defaultBaseUrl, "anthropic"),
    ).toBe("http://127.0.0.1:3000");
  });
});
