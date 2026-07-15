import { type FastifyInstance } from "fastify";
import { type GatewayCompletionRequest } from "./schemas.js";
import { type CompletionOutcome } from "./app-server.js";
export interface GatewayRuntime {
    activeRequests: number;
    start(): Promise<void>;
    stop(): Promise<void>;
    models(): Promise<Array<{
        id: string;
        isDefault?: boolean;
    }>>;
    complete(request: GatewayCompletionRequest, onDelta?: (delta: string) => void, signal?: AbortSignal): Promise<CompletionOutcome>;
}
export interface GatewayServerOptions {
    key: string;
    workspace: string;
    codexVersion: string;
    verbose?: boolean;
    runtime?: GatewayRuntime;
}
export declare function createGatewayServer(options: GatewayServerOptions): {
    app: FastifyInstance;
    runtime: GatewayRuntime;
};
