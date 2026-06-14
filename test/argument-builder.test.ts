import { describe, expect, it } from "vitest";
import { buildTargetArguments } from "../src/core/argument-builder.js";

describe("target argument builder", () => {
  it("injects Codex provider and model overrides", () => {
    expect(
      buildTargetArguments({
        target: {
          id: "codex",
          name: "Codex",
          command: "codex",
          envProfile: "openai",
          argumentProfile: "codex",
          defaultArgs: [],
        },
        providerName: "Vercel AI Gateway",
        baseUrl: "https://ai-gateway.vercel.sh/v1",
        model: "deepseek/deepseek-v4-pro",
        userArgs: ["--no-alt-screen"],
      }),
    ).toEqual([
      "-c",
      'model="deepseek/deepseek-v4-pro"',
      "-c",
      'model_provider="cc_byok"',
      "-c",
      'model_providers.cc_byok.name="Vercel AI Gateway"',
      "-c",
      'model_providers.cc_byok.base_url="https://ai-gateway.vercel.sh/v1"',
      "-c",
      'model_providers.cc_byok.env_key="OPENAI_API_KEY"',
      "-c",
      'model_providers.cc_byok.wire_api="responses"',
      "--no-alt-screen",
    ]);
  });

  it("places Codex App overrides after its subcommand", () => {
    const args = buildTargetArguments({
      target: {
        id: "codex-app",
        name: "Codex App",
        command: "codex",
        envProfile: "openai",
        argumentProfile: "codex",
        defaultArgs: ["app"],
      },
      providerName: "Vercel AI Gateway",
      baseUrl: "https://ai-gateway.vercel.sh/v1",
      model: "openai/gpt-5.4",
      userArgs: ["E:\\project"],
    });

    expect(args[0]).toBe("app");
    expect(args).toContain('model="openai/gpt-5.4"');
    expect(args.at(-1)).toBe("E:\\project");
  });
});
