import { describe, expect, it } from "vitest";
import { createGatewayServer, type GatewayRuntime } from "../src/gateway/server.js";
import type { GatewayCompletionRequest } from "../src/gateway/schemas.js";
import type { CompletionOutcome } from "../src/gateway/app-server.js";

class FakeRuntime implements GatewayRuntime {
  activeRequests = 0;
  lastRequest: GatewayCompletionRequest | null = null;
  async start() {} async stop() {}
  async models() { return [{ id: "gpt-test", isDefault: true }]; }
  async complete(request: GatewayCompletionRequest, onDelta?: (delta: string) => void): Promise<CompletionOutcome> {
    this.lastRequest = request;
    if (request.toolResults.length) return { type: "completed", text: "tool accepted", status: "completed" };
    if (request.tools.length) return { type: "tools", text: "", calls: [{ id: "call_1", name: request.tools[0]!.name, arguments: { path: "x" } }] };
    onDelta?.("hello"); onDelta?.(" world"); return { type: "completed", text: "hello world", status: "completed" };
  }
}

describe("gateway HTTP compatibility", () => {
  it("requires the bearer key and exposes models plus the default alias", async () => {
    const { app } = createGatewayServer({ key: "secret", workspace: "/tmp", codexVersion: "0.144.4", runtime: new FakeRuntime() });
    expect((await app.inject({ method: "GET", url: "/v1/models" })).statusCode).toBe(401);
    const response = await app.inject({ method: "GET", url: "/v1/models", headers: { authorization: "Bearer secret" } });
    expect(response.statusCode).toBe(200); expect(response.json().data.map((m: { id: string }) => m.id)).toEqual(["codex-latest", "gpt-test"]);
    await app.close();
  });

  it("returns OpenAI-shaped text and tool call completions", async () => {
    const { app } = createGatewayServer({ key: "secret", workspace: "/tmp", codexVersion: "0.144.4", runtime: new FakeRuntime() });
    const text = await app.inject({ method: "POST", url: "/v1/chat/completions", headers: { authorization: "Bearer secret" }, payload: { model: "codex-latest", messages: [{ role: "user", content: "hi" }] } });
    expect(text.json().choices[0]).toMatchObject({ message: { role: "assistant", content: "hello world" }, finish_reason: "stop" });
    const tools = await app.inject({ method: "POST", url: "/v1/chat/completions", headers: { authorization: "Bearer secret" }, payload: { model: "codex-latest", messages: [{ role: "user", content: "read x" }], tools: [{ type: "function", function: { name: "read", parameters: { type: "object" } } }] } });
    expect(tools.json().choices[0]).toMatchObject({ finish_reason: "tool_calls", message: { tool_calls: [{ id: "call_1", function: { name: "read" } }] } });
    await app.close();
  });

  it("streams chunks and the DONE sentinel", async () => {
    const { app } = createGatewayServer({ key: "secret", workspace: "/tmp", codexVersion: "0.144.4", runtime: new FakeRuntime() });
    const response = await app.inject({ method: "POST", url: "/v1/chat/completions", headers: { authorization: "Bearer secret" }, payload: { model: "codex-latest", stream: true, messages: [{ role: "user", content: "hi" }] } });
    expect(response.headers["content-type"]).toContain("text/event-stream"); expect(response.body).toContain('"content":"hello"'); expect(response.body).toContain("data: [DONE]");
    await app.close();
  });

  it("accepts Anthropic bearer or x-api-key auth and requires a version", async () => {
    const { app } = createGatewayServer({ key: "secret", workspace: "/tmp", codexVersion: "0.144.4", runtime: new FakeRuntime() });
    const payload = { model: "codex-latest", max_tokens: 1024, messages: [{ role: "user", content: "hi" }] };
    expect((await app.inject({ method: "POST", url: "/v1/messages", payload })).json()).toMatchObject({ type: "error", error: { type: "authentication_error" } });
    expect((await app.inject({ method: "POST", url: "/v1/messages", headers: { "x-api-key": "secret" }, payload })).json()).toMatchObject({ type: "error", error: { type: "invalid_request_error" } });
    const response = await app.inject({ method: "POST", url: "/v1/messages", headers: { "x-api-key": "secret", "anthropic-version": "2023-06-01" }, payload });
    expect(response.statusCode).toBe(200); expect(response.json()).toMatchObject({ type: "message", role: "assistant", content: [{ type: "text", text: "hello world" }], stop_reason: "end_turn" });
    await app.close();
  });

  it("accepts Claude Code system-role history and merges it into system instructions", async () => {
    const runtime = new FakeRuntime(); const { app } = createGatewayServer({ key: "secret", workspace: "/tmp", codexVersion: "0.144.4", runtime });
    const response = await app.inject({ method: "POST", url: "/v1/messages?beta=true", headers: { authorization: "Bearer secret", "anthropic-version": "2023-06-01" }, payload: { model: "codex-latest", max_tokens: 1024, system: [{ type: "text", text: "primary" }], messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }, { role: "system", content: "runtime reminder" }] } });
    expect(response.statusCode).toBe(200); expect(runtime.lastRequest?.system).toBe("primary\n\nruntime reminder"); expect(runtime.lastRequest?.messages.map((message) => message.role)).toEqual(["user"]);
    await app.close();
  });

  it("rejects unsupported Anthropic content blocks and invalid tool choices", async () => {
    const { app } = createGatewayServer({ key: "secret", workspace: "/tmp", codexVersion: "0.144.4", runtime: new FakeRuntime() });
    const headers = { authorization: "Bearer secret", "anthropic-version": "2023-06-01" };
    const image = await app.inject({ method: "POST", url: "/v1/messages", headers, payload: { model: "codex-latest", max_tokens: 10, messages: [{ role: "user", content: [{ type: "image", source: {} }] }] } });
    expect(image.statusCode).toBe(400); expect(image.json()).toMatchObject({ type: "error", error: { type: "invalid_request_error" } });
    const choice = await app.inject({ method: "POST", url: "/v1/messages", headers, payload: { model: "codex-latest", max_tokens: 10, messages: [{ role: "user", content: "hi" }], tools: [{ name: "read", input_schema: { type: "object" } }], tool_choice: { type: "tool", name: "write" } } });
    expect(choice.statusCode).toBe(400); expect(choice.json().error.message).toContain("not provided");
    await app.close();
  });

  it("translates Anthropic tools and failed tool results", async () => {
    const runtime = new FakeRuntime(); const { app } = createGatewayServer({ key: "secret", workspace: "/tmp", codexVersion: "0.144.4", runtime });
    const headers = { authorization: "Bearer secret", "anthropic-version": "2023-06-01" };
    const tools = await app.inject({ method: "POST", url: "/v1/messages", headers, payload: { model: "codex-latest", max_tokens: 1024, system: "Use tools", messages: [{ role: "user", content: "read x" }], tools: [{ name: "read", description: "Read a file", input_schema: { type: "object" } }], tool_choice: { type: "tool", name: "read" } } });
    expect(tools.json()).toMatchObject({ stop_reason: "tool_use", content: [{ type: "tool_use", id: "call_1", name: "read", input: { path: "x" } }] });
    expect(runtime.lastRequest).toMatchObject({ system: "Use tools", toolChoice: { name: "read" } });
    const result = await app.inject({ method: "POST", url: "/v1/messages", headers, payload: { model: "codex-latest", max_tokens: 1024, messages: [{ role: "user", content: [{ type: "tool_result", tool_use_id: "call_1", content: "failed", is_error: true }] }] } });
    expect(result.json().content[0].text).toBe("tool accepted"); expect(runtime.lastRequest?.toolResults).toEqual([{ callId: "call_1", content: "failed", success: false }]);
    await app.close();
  });

  it("streams Anthropic text and tool events without an OpenAI DONE sentinel", async () => {
    const { app } = createGatewayServer({ key: "secret", workspace: "/tmp", codexVersion: "0.144.4", runtime: new FakeRuntime() });
    const response = await app.inject({ method: "POST", url: "/v1/messages", headers: { authorization: "Bearer secret", "anthropic-version": "2023-06-01" }, payload: { model: "codex-latest", max_tokens: 1024, stream: true, messages: [{ role: "user", content: "read" }], tools: [{ name: "read", input_schema: { type: "object" } }] } });
    expect(response.body).toContain("event: message_start"); expect(response.body).toContain("event: content_block_start"); expect(response.body).toContain('"type":"input_json_delta"'); expect(response.body).toContain('"stop_reason":"tool_use"'); expect(response.body).toContain("event: message_stop"); expect(response.body).not.toContain("[DONE]");
    await app.close();
  });
});
