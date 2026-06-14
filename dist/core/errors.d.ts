export type ErrorCode = "NOT_INITIALIZED" | "INVALID_CONFIG" | "UNKNOWN_PROVIDER" | "MISSING_MODEL" | "MISSING_KEY" | "KEYCHAIN_UNAVAILABLE" | "CLAUDE_NOT_FOUND" | "SPAWN_FAILED" | "CANCELLED" | "INVALID_INPUT";
export declare class CliError extends Error {
    readonly code: ErrorCode;
    readonly exitCode: number;
    constructor(message: string, code: ErrorCode, exitCode?: number, options?: ErrorOptions);
}
export declare function errorMessage(error: unknown): string;
