export type ErrorCode =
  | "NOT_INITIALIZED"
  | "INVALID_CONFIG"
  | "UNKNOWN_PROVIDER"
  | "UNKNOWN_TARGET"
  | "INCOMPATIBLE_TARGET"
  | "UNSUPPORTED_RESTORE"
  | "MISSING_PROVIDER"
  | "MISSING_MODEL"
  | "MISSING_KEY"
  | "KEYCHAIN_UNAVAILABLE"
  | "TARGET_NOT_FOUND"
  | "SPAWN_FAILED"
  | "CANCELLED"
  | "INVALID_INPUT";

export class CliError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly exitCode = 1,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "CliError";
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
