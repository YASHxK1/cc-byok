import { describe, expect, it } from "vitest";
import { buildTargetEnvironment } from "../src/core/env-builder.js";
import { OPENROUTER } from "../src/providers/openrouter.js";
import { VERCEL_AI_GATEWAY } from "../src/providers/vercel-ai-gateway.js";

describe("target environment builder", () => {
  it("builds the Claude/OpenRouter environment without exposing inherited keys", () => {
    expect(
      buildTargetEnvironment({
        baseUrl: OPENROUTER.resolveBaseUrl(
          OPENROUTER.defaultBaseUrl,
          "anthropic",
        ),
        apiKey: "secret-value",
        model: "qwen/qwen3-coder",
        target: {
          id: "claude",
          name: "Claude Code",
          command: "claude",
          envProfile: "anthropic",
          defaultArgs: [],
        },
      }),
    ).toEqual({
      ANTHROPIC_BASE_URL: "https://openrouter.ai/api",
      ANTHROPIC_AUTH_TOKEN: "secret-value",
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_MODEL: "qwen/qwen3-coder",
    });
  });

it("passes model ID through unchanged for codex-app", () => {
    expect(
      buildTargetEnvironment({
        baseUrl: VERCEL_AI_GATEWAY.resolveBaseUrl(
          VERCEL_AI_GATEWAY.defaultBaseUrl,
          "openai",
        ),
        apiKey: "vercel-key",
        model: "deepseek/deepseek-v4-pro",
        target: {
          id: "codex-app",
          name: "Codex App",
          command: "codex",
          envProfile: "openai",
          defaultArgs: ["app"],
        },
      }),
    ).toEqual({
      OPENAI_BASE_URL: "https://ai-gateway.vercel.sh/v1",
      OPENAI_API_KEY: "vercel-key",
      OPENAI_MODEL: "deepseek/deepseek-v4-pro",
    });
  });

  it("builds OpenAI, Ollama, and custom environments", () => {
    expect(
      buildTargetEnvironment({
        baseUrl: "https://gateway.example/v1",
        apiKey: "key",
        model: "openai/gpt-4.1",
        target: {
          id: "codex",
          name: "Codex",
          command: "codex",
          envProfile: "openai",
          defaultArgs: [],
        },
      }),
    ).toEqual({
      OPENAI_BASE_URL: "https://gateway.example/v1",
      OPENAI_API_KEY: "key",
      OPENAI_MODEL: "openai/gpt-4.1",
    });

    expect(
      buildTargetEnvironment({
        baseUrl: "http://localhost:11434",
        apiKey: null,
        model: "qwen3",
        target: {
          id: "local",
          name: "Local",
          command: "local",
          envProfile: "ollama",
          defaultArgs: [],
        },
      }),
    ).toEqual({ OLLAMA_HOST: "http://localhost:11434", MODEL: "qwen3" });

    expect(
      buildTargetEnvironment({
        baseUrl: "https://custom.example",
        apiKey: "custom-key",
        model: "custom-model",
        target: {
          id: "custom",
          name: "Custom",
          command: "custom",
          envProfile: "custom",
          defaultArgs: [],
          customEnvMapping: {
            baseUrl: "CUSTOM_URL",
            apiKey: "CUSTOM_KEY",
            model: "CUSTOM_MODEL",
          },
        },
      }),
    ).toEqual({
      CUSTOM_URL: "https://custom.example",
      CUSTOM_KEY: "custom-key",
      CUSTOM_MODEL: "custom-model",
    });
  });
});

describe("built-in provider endpoints", () => {
  it("resolves protocol-specific OpenRouter and Vercel endpoints", () => {
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
});
