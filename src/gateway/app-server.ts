import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
import { createInterface, type Interface } from "node:readline";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { GatewayCompletionRequest } from "./schemas.js";

type JsonObject = Record<string, unknown>;
interface RpcMessage { id?: string | number; method?: string; params?: JsonObject; result?: unknown; error?: { message?: string } }
interface PendingRpc { resolve(value: unknown): void; reject(error: Error): void }
export interface ToolCall { id: string; name: string; arguments: unknown }
export type CompletionOutcome = { type: "completed"; text: string; status: string } | { type: "tools"; text: string; calls: ToolCall[] };

interface TurnSession {
  threadId: string; turnId: string | null; text: string; emitter: EventEmitter;
  tools: ToolCall[]; toolTimer?: NodeJS.Timeout; closed: boolean;
}

const rpcSchema = z.object({ id: z.union([z.string(), z.number()]).optional(), method: z.string().optional(), params: z.record(z.string(), z.unknown()).optional(), result: z.unknown().optional(), error: z.object({ message: z.string().optional() }).passthrough().optional() }).passthrough();

export class CodexAppServer {
  private child: ChildProcessWithoutNullStreams | null = null;
  private lines: Interface | null = null;
  private nextId = 1;
  private pending = new Map<string | number, PendingRpc>();
  private sessions = new Map<string, TurnSession>();
  private pendingTools = new Map<string, { rpcId: string | number; session: TurnSession; expires: NodeJS.Timeout }>();
  private stopping = false;
  private restartCount = 0;
  private starting: Promise<void> | null = null;

  constructor(private readonly workspace: string, private readonly verbose = false, private readonly env: NodeJS.ProcessEnv = process.env) {}

  async start(): Promise<void> {
    if (this.child) return;
    if (this.starting) return this.starting;
    this.starting = this.spawnAndInitialize().finally(() => { this.starting = null; });
    return this.starting;
  }

  async stop(): Promise<void> {
    this.stopping = true;
    for (const session of this.sessions.values()) this.failSession(session, new Error("Gateway is shutting down."));
    this.lines?.close(); this.child?.kill("SIGTERM"); this.child = null;
  }

  get activeRequests(): number { return [...this.sessions.values()].filter((s) => !s.closed).length; }

  async models(): Promise<Array<{ id: string; isDefault?: boolean }>> {
    await this.start();
    const response = await this.request("model/list", { includeHidden: false }) as { data?: Array<{ id?: string; model?: string; isDefault?: boolean }> };
    return (response.data ?? []).map((m) => ({ id: m.model ?? m.id ?? "", isDefault: m.isDefault })).filter((m) => m.id);
  }

  async complete(request: GatewayCompletionRequest, onDelta?: (delta: string) => void, signal?: AbortSignal): Promise<CompletionOutcome> {
    await this.start();
    const toolResults = request.toolResults;
    if (toolResults.length) {
      let session: TurnSession | null = null;
      const resolved: Array<{ id: string; pending: { rpcId: string | number; session: TurnSession; expires: NodeJS.Timeout }; text: string; success: boolean }> = [];
      for (const result of toolResults) {
        const id = result.callId;
        const pending = id ? this.pendingTools.get(id) : undefined;
        if (!id || !pending) throw new GatewayProtocolError(`Unknown or expired tool_call_id "${id ?? ""}".`, 400);
        if (session && session !== pending.session) throw new GatewayProtocolError("Tool results belong to different suspended turns.", 400);
        session = pending.session;
        resolved.push({ id, pending, text: result.content, success: result.success });
      }
      if (!session) throw new GatewayProtocolError("No tool results were supplied.", 400);
      const supplied = new Set(resolved.map((item) => item.id));
      const missing = [...this.pendingTools.entries()].filter(([, value]) => value.session === session).map(([id]) => id).filter((id) => !supplied.has(id));
      if (missing.length) throw new GatewayProtocolError(`Missing tool results for: ${missing.join(", ")}.`, 400);
      for (const item of resolved) { clearTimeout(item.pending.expires); this.pendingTools.delete(item.id); this.respond(item.pending.rpcId, { contentItems: [{ type: "inputText", text: item.text }], success: item.success }); }
      session.tools = []; session.text = "";
      return this.waitForOutcome(session, onDelta, signal);
    }

    if (this.pendingTools.size >= 100) throw new GatewayProtocolError("The gateway has too many suspended tool sessions.", 503);
    if (request.model !== "codex-latest") {
      const available = await this.models();
      if (!available.some((model) => model.id === request.model)) throw new GatewayProtocolError(`Unknown Codex model "${request.model}". Use "codex-latest" or an ID returned by /v1/models.`, 400);
    }
    const dynamicTools = request.toolChoice === "none" ? [] : request.tools.map((tool) => ({ type: "function", name: tool.name, description: tool.description, inputSchema: tool.inputSchema }));
    const requiredTool = typeof request.toolChoice === "object" ? request.toolChoice.name : request.toolChoice === "required" ? "one of the supplied tools" : null;
    const transcript = `${request.messages.map((m) => `${m.role.toUpperCase()}: ${m.text}${m.toolCalls?.length ? `\nTOOL CALLS: ${JSON.stringify(m.toolCalls)}` : ""}`).join("\n\n")}${requiredTool ? `\n\nYou must call ${requiredTool}.` : ""}`;
    const model = request.model === "codex-latest" ? null : request.model;
    const started = await this.request("thread/start", { model, cwd: this.workspace, approvalPolicy: "never", sandbox: "read-only", ephemeral: true, dynamicTools, developerInstructions: request.system ?? null }) as { thread?: { id?: string } };
    const threadId = started.thread?.id;
    if (!threadId) throw new Error("Codex app-server returned no thread ID.");
    const session: TurnSession = { threadId, turnId: null, text: "", emitter: new EventEmitter(), tools: [], closed: false };
    this.sessions.set(threadId, session);
    const outcome = this.waitForOutcome(session, onDelta, signal);
    try {
      const turn = await this.request("turn/start", { threadId, input: [{ type: "text", text: transcript, text_elements: [] }], approvalPolicy: "never" }) as { turn?: { id?: string } };
      session.turnId = turn.turn?.id ?? null;
    } catch (error) { this.failSession(session, error instanceof Error ? error : new Error(String(error))); }
    return outcome;
  }

  private waitForOutcome(session: TurnSession, onDelta?: (delta: string) => void, signal?: AbortSignal): Promise<CompletionOutcome> {
    return new Promise((resolve, reject) => {
      const delta = (value: string) => onDelta?.(value);
      const done = (value: CompletionOutcome) => { cleanup(); resolve(value); };
      const fail = (error: Error) => { cleanup(); reject(error); };
      const abort = () => { cleanup(); void this.interrupt(session); reject(new GatewayProtocolError("Client disconnected.", 499)); };
      const cleanup = () => { session.emitter.off("delta", delta); session.emitter.off("outcome", done); session.emitter.off("failed", fail); signal?.removeEventListener("abort", abort); };
      session.emitter.on("delta", delta); session.emitter.once("outcome", done); session.emitter.once("failed", fail); signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();
    });
  }

  private async spawnAndInitialize(): Promise<void> {
    const child = spawn("codex", ["app-server", "--stdio"], { cwd: this.workspace, env: this.env, stdio: ["pipe", "pipe", "pipe"], shell: false });
    this.child = child;
    this.lines = createInterface({ input: child.stdout });
    this.lines.on("line", (line) => this.onLine(line));
    child.stderr.on("data", (data) => { if (this.verbose) process.stderr.write(`[codex] ${String(data)}`); });
    child.once("error", (error) => this.onCrash(error));
    child.once("exit", (code, signal) => this.onCrash(new Error(`Codex app-server exited (${signal ?? code ?? "unknown"}).`)));
    await this.request("initialize", { clientInfo: { name: "cc_byok_gateway", title: "cc-byok Gateway", version: "0.3.2" }, capabilities: { experimentalApi: true } });
    this.notify("initialized", {}); this.restartCount = 0;
  }

  private onLine(line: string): void {
    let parsed: z.infer<typeof rpcSchema>;
    try { parsed = rpcSchema.parse(JSON.parse(line)); } catch { if (this.verbose) process.stderr.write(`[codex invalid json] ${line}\n`); return; }
    const msg = parsed as RpcMessage;
    if (msg.id !== undefined && !msg.method) {
      const pending = this.pending.get(msg.id); if (!pending) return; this.pending.delete(msg.id);
      msg.error ? pending.reject(new Error(msg.error.message ?? "Codex app-server error")) : pending.resolve(msg.result);
      return;
    }
    if (msg.method && msg.id !== undefined) { this.onServerRequest(msg); return; }
    if (msg.method) this.onNotification(msg.method, msg.params ?? {});
  }

  private onNotification(method: string, params: JsonObject): void {
    const threadId = typeof params.threadId === "string" ? params.threadId : undefined;
    const session = threadId ? this.sessions.get(threadId) : undefined;
    if (!session) return;
    if (method === "item/agentMessage/delta" && typeof params.delta === "string") { session.text += params.delta; session.emitter.emit("delta", params.delta); }
    if (method === "turn/completed") {
      const turn = params.turn as JsonObject | undefined; const status = typeof turn?.status === "string" ? turn.status : "completed";
      if (session.tools.length) return;
      session.closed = true; this.sessions.delete(session.threadId);
      if (status === "failed") this.failSession(session, new Error(String((turn?.error as JsonObject | undefined)?.message ?? "Codex turn failed.")));
      else session.emitter.emit("outcome", { type: "completed", text: session.text, status });
    }
  }

  private onServerRequest(msg: RpcMessage): void {
    if (msg.method === "item/tool/call") {
      const p = msg.params ?? {}; const threadId = String(p.threadId ?? ""); const callId = String(p.callId ?? randomUUID()); const session = this.sessions.get(threadId);
      if (!session) { this.respond(msg.id!, { contentItems: [], success: false }); return; }
      const call: ToolCall = { id: callId, name: String(p.tool ?? ""), arguments: p.arguments ?? {} };
      session.tools.push(call);
      const expires = setTimeout(() => { this.pendingTools.delete(callId); this.respond(msg.id!, { contentItems: [{ type: "inputText", text: "Tool call expired." }], success: false }); void this.interrupt(session); }, 10 * 60_000);
      this.pendingTools.set(callId, { rpcId: msg.id!, session, expires });
      if (session.toolTimer) clearTimeout(session.toolTimer);
      session.toolTimer = setTimeout(() => session.emitter.emit("outcome", { type: "tools", text: session.text, calls: [...session.tools] }), 15);
      return;
    }
    this.respond(msg.id!, { decision: "decline" });
  }

  private async interrupt(session: TurnSession): Promise<void> { try { if (session.turnId) await this.request("turn/interrupt", { threadId: session.threadId, turnId: session.turnId }); } catch {} }
  private request(method: string, params: JsonObject): Promise<unknown> { const id = this.nextId++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.send({ method, id, params }); }); }
  private notify(method: string, params: JsonObject): void { this.send({ method, params }); }
  private respond(id: string | number, result: unknown): void { this.send({ id, result }); }
  private send(message: unknown): void { if (!this.child?.stdin.writable) throw new Error("Codex app-server is not running."); this.child.stdin.write(`${JSON.stringify(message)}\n`); }

  private failSession(session: TurnSession, error: Error): void { session.closed = true; this.sessions.delete(session.threadId); session.emitter.emit("failed", error); }
  private onCrash(error: Error): void {
    if (this.child === null) return; this.child = null; this.lines?.close(); this.lines = null;
    for (const p of this.pending.values()) p.reject(error); this.pending.clear();
    for (const s of this.sessions.values()) this.failSession(s, error);
    if (!this.stopping && this.restartCount < 3) { const delay = [1000, 2000, 4000][this.restartCount++]!; setTimeout(() => void this.start().catch(() => undefined), delay); }
  }
}

export class GatewayProtocolError extends Error { constructor(message: string, readonly statusCode: number) { super(message); } }
