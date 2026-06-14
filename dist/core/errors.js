export class CliError extends Error {
    code;
    exitCode;
    constructor(message, code, exitCode = 1, options) {
        super(message, options);
        this.code = code;
        this.exitCode = exitCode;
        this.name = "CliError";
    }
}
export function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=errors.js.map