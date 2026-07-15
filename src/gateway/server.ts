import { randomUUID, timingSafeEqual } from "node:crypto";
import Fastify, { type FastifyInstance, type FastifyReply } from "fastify";
import { anthropicMessagesRequestSchema, chatCompletionRequestSchema, fromAnthropic, fromOpenAi, type GatewayCompletionRequest } from "./schemas.js";
import { CodexAppServer, GatewayProtocolError, type CompletionOutcome, type ToolCall } from "./app-server.js";

export interface GatewayRuntime {
  activeRequests: number;
  start(): Promise<void>; stop(): Promise<void>;
  models(): Promise<Array<{ id: string; isDefault?: boolean }>>;
  complete(request: GatewayCompletionRequest, onDelta?: (delta: string) => void, signal?: AbortSignal): Promise<CompletionOutcome>;
}

export interface GatewayServerOptions { key: string; workspace: string; codexVersion: string; verbose?: boolean; runtime?: GatewayRuntime }

export function createGatewayServer(options: GatewayServerOptions): { app: FastifyInstance; runtime: GatewayRuntime } {
  const app = Fastify({ logger: options.verbose ?? false });
  const runtime = options.runtime ?? new CodexAppServer(options.workspace, options.verbose);
  const startedAt = Date.now();

  app.addHook("onRequest", async (request, reply) => {
    const authorization = request.headers.authorization;
    const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
    const apiKeyHeader = request.headers["x-api-key"];
    const apiKey = typeof apiKeyHeader === "string" ? apiKeyHeader : "";
    if (secureEqual(bearer, options.key) || secureEqual(apiKey, options.key)) return;
    if (request.url.startsWith("/v1/messages")) return reply.code(401).send(anthropicError("authentication_error", "Invalid or missing API key."));
    return reply.code(401).send(openAiError("Invalid or missing bearer token.", "authentication_error"));
  });

  app.get("/v1/status", async () => ({ runtime: "running", authenticated: true, codex_version: options.codexVersion, uptime_seconds: Math.floor((Date.now() - startedAt) / 1000), active_requests: runtime.activeRequests }));
  app.get("/v1/models", async () => {
    const models = await runtime.models(); const now = Math.floor(Date.now() / 1000);
    const data = models.map((m) => ({ id: m.id, object: "model", created: now, owned_by: "openai" }));
    if (!data.some((m) => m.id === "codex-latest")) data.unshift({ id: "codex-latest", object: "model", created: now, owned_by: "openai" });
    return { object: "list", data };
  });

  app.post("/v1/chat/completions", async (rawRequest, reply) => {
    const parsed = chatCompletionRequestSchema.safeParse(rawRequest.body);
    if (!parsed.success) return reply.code(400).send(openAiError(parsed.error.issues[0]?.message ?? "Invalid request.", "invalid_request_error"));
    const request = parsed.data; const normalized = fromOpenAi(request); const id = `chatcmpl-${randomUUID().replaceAll("-", "")}`; const created = Math.floor(Date.now() / 1000);
    try {
      if (request.stream) {
        const controller = requestAbortController(rawRequest.raw);
        reply.hijack(); setSseHeaders(reply.raw);
        writeOpenAiChunk(reply.raw, id, created, request.model, { role: "assistant", content: "" }, null);
        const outcome = await runtime.complete(normalized, (delta) => writeOpenAiChunk(reply.raw, id, created, request.model, { content: delta }, null), controller.signal);
        if (outcome.type === "tools") writeOpenAiChunk(reply.raw, id, created, request.model, { tool_calls: outcome.calls.map((call, index) => ({ index, id: call.id, type: "function", function: { name: call.name, arguments: JSON.stringify(call.arguments) } })) }, null);
        writeOpenAiChunk(reply.raw, id, created, request.model, {}, outcome.type === "tools" ? "tool_calls" : "stop"); reply.raw.write("data: [DONE]\n\n"); reply.raw.end(); return;
      }
      const outcome = await runtime.complete(normalized);
      const message = outcome.type === "tools" ? { role: "assistant", content: outcome.text || null, tool_calls: outcome.calls.map(openAiToolCall) } : { role: "assistant", content: outcome.text };
      return { id, object: "chat.completion", created, model: request.model, choices: [{ index: 0, message, finish_reason: outcome.type === "tools" ? "tool_calls" : "stop" }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } };
    } catch (error) { return handleOpenAiFailure(error, reply); }
  });

  app.post("/v1/messages", async (rawRequest, reply) => {
    if (!rawRequest.headers["anthropic-version"]) return reply.code(400).send(anthropicError("invalid_request_error", "Missing required anthropic-version header."));
    const parsed = anthropicMessagesRequestSchema.safeParse(rawRequest.body);
    if (!parsed.success) return reply.code(400).send(anthropicError("invalid_request_error", parsed.error.issues[0]?.message ?? "Invalid request."));
    const request = parsed.data; const normalized = fromAnthropic(request); const id = `msg_${randomUUID().replaceAll("-", "")}`;
    try {
      if (request.stream) {
        const controller = requestAbortController(rawRequest.raw);
        reply.hijack(); setSseHeaders(reply.raw);
        writeAnthropicEvent(reply.raw, "message_start", { type: "message_start", message: anthropicMessage(id, request.model, [], null) });
        let index = 0; let textStarted = false;
        const outcome = await runtime.complete(normalized, (delta) => {
          if (!textStarted) { writeAnthropicEvent(reply.raw, "content_block_start", { type: "content_block_start", index, content_block: { type: "text", text: "" } }); textStarted = true; }
          writeAnthropicEvent(reply.raw, "content_block_delta", { type: "content_block_delta", index, delta: { type: "text_delta", text: delta } });
        }, controller.signal);
        if (textStarted) { writeAnthropicEvent(reply.raw, "content_block_stop", { type: "content_block_stop", index }); index++; }
        if (outcome.type === "tools") for (const call of outcome.calls) {
          writeAnthropicEvent(reply.raw, "content_block_start", { type: "content_block_start", index, content_block: { type: "tool_use", id: call.id, name: call.name, input: {} } });
          writeAnthropicEvent(reply.raw, "content_block_delta", { type: "content_block_delta", index, delta: { type: "input_json_delta", partial_json: JSON.stringify(call.arguments) } });
          writeAnthropicEvent(reply.raw, "content_block_stop", { type: "content_block_stop", index }); index++;
        }
        writeAnthropicEvent(reply.raw, "message_delta", { type: "message_delta", delta: { stop_reason: outcome.type === "tools" ? "tool_use" : "end_turn", stop_sequence: null }, usage: { output_tokens: 0 } });
        writeAnthropicEvent(reply.raw, "message_stop", { type: "message_stop" }); reply.raw.end(); return;
      }
      const outcome = await runtime.complete(normalized); const content: Array<Record<string, unknown>> = [];
      if (outcome.text) content.push({ type: "text", text: outcome.text });
      if (outcome.type === "tools") content.push(...outcome.calls.map((call) => ({ type: "tool_use", id: call.id, name: call.name, input: call.arguments })));
      return anthropicMessage(id, request.model, content, outcome.type === "tools" ? "tool_use" : "end_turn");
    } catch (error) {
      const type = anthropicErrorType(error); const status = errorStatus(error);
      if (reply.raw.headersSent) { writeAnthropicEvent(reply.raw, "error", anthropicError(type, errorText(error))); reply.raw.end(); return; }
      return reply.code(status).send(anthropicError(type, errorText(error)));
    }
  });

  app.setErrorHandler((error, request, reply) => { const message = error instanceof Error ? error.message : String(error); void reply.code(500).send(request.url.startsWith("/v1/messages") ? anthropicError("api_error", message) : openAiError(message, "server_error")); });
  return { app, runtime };
}

function anthropicMessage(id: string, model: string, content: Array<Record<string, unknown>>, stopReason: string | null) { return { id, type: "message", role: "assistant", model, content, stop_reason: stopReason, stop_sequence: null, usage: { input_tokens: 0, output_tokens: 0 } }; }
function anthropicError(type: string, message: string) { return { type: "error", error: { type, message } }; }
function anthropicErrorType(error: unknown): string { const status = errorStatus(error); return status === 400 ? "invalid_request_error" : status === 503 ? "overloaded_error" : "api_error"; }
function errorStatus(error: unknown): number { return error instanceof GatewayProtocolError ? error.statusCode : 502; }
function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function handleOpenAiFailure(error: unknown, reply: FastifyReply) { const status = errorStatus(error); if (reply.raw.headersSent) { reply.raw.write(`data: ${JSON.stringify(openAiError(errorText(error), "upstream_error"))}\n\n`); reply.raw.write("data: [DONE]\n\n"); reply.raw.end(); return; } return reply.code(status).send(openAiError(errorText(error), status === 400 ? "invalid_request_error" : "upstream_error")); }
function openAiError(message: string, type: string) { return { error: { message, type, param: null, code: null } }; }
function openAiToolCall(call: ToolCall) { return { id: call.id, type: "function", function: { name: call.name, arguments: JSON.stringify(call.arguments) } }; }
function secureEqual(a: string, b: string): boolean { const aa = Buffer.from(a), bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb); }
function setSseHeaders(stream: NodeJS.WritableStream & { statusCode?: number; setHeader(name: string, value: string): void }): void { stream.statusCode = 200; stream.setHeader("Content-Type", "text/event-stream; charset=utf-8"); stream.setHeader("Cache-Control", "no-cache"); stream.setHeader("Connection", "keep-alive"); }
function writeOpenAiChunk(stream: NodeJS.WritableStream, id: string, created: number, model: string, delta: Record<string, unknown>, finishReason: string | null): void { stream.write(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model, choices: [{ index: 0, delta, finish_reason: finishReason }] })}\n\n`); }
function writeAnthropicEvent(stream: NodeJS.WritableStream, event: string, data: unknown): void { stream.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); }
function requestAbortController(request: NodeJS.EventEmitter): AbortController { const controller = new AbortController(); request.once("aborted", () => controller.abort()); return controller; }
