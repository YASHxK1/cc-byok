import type { GatewayCompletionRequest } from "./schemas.js";
export interface ToolCall {
    id: string;
    name: string;
    arguments: unknown;
}
export type CompletionOutcome = {
    type: "completed";
    text: string;
    status: string;
} | {
    type: "tools";
    text: string;
    calls: ToolCall[];
};
export declare class CodexAppServer {
    private readonly workspace;
    private readonly verbose;
    private readonly env;
    private child;
    private lines;
    private nextId;
    private pending;
    private sessions;
    private pendingTools;
    private stopping;
    private restartCount;
    private starting;
    constructor(workspace: string, verbose?: boolean, env?: NodeJS.ProcessEnv);
    start(): Promise<void>;
    stop(): Promise<void>;
    get activeRequests(): number;
    models(): Promise<Array<{
        id: string;
        isDefault?: boolean;
    }>>;
    complete(request: GatewayCompletionRequest, onDelta?: (delta: string) => void, signal?: AbortSignal): Promise<CompletionOutcome>;
    private waitForOutcome;
    private spawnAndInitialize;
    private onLine;
    private onNotification;
    private onServerRequest;
    private interrupt;
    private request;
    private notify;
    private respond;
    private send;
    private failSession;
    private onCrash;
}
export declare class GatewayProtocolError extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode: number);
}
