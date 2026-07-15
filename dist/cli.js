#!/usr/bin/env node
import { createAppContext } from "./app-context.js";
import { CliError, errorMessage } from "./core/errors.js";
import { createProgram } from "./program.js";
async function main() {
    const context = createAppContext();
    try {
        await createProgram(context).parseAsync(process.argv);
    }
    catch (error) {
        if (error instanceof CliError) {
            const write = error.exitCode === 0 ? context.output.log : context.output.error;
            write.call(context.output, error.message);
            context.setExitCode(error.exitCode);
            return;
        }
        context.output.error(`Unexpected error: ${errorMessage(error)}`);
        if (process.env.CC_BYOK_DEBUG && error instanceof Error) {
            context.output.error(error.stack ?? error.message);
        }
        context.setExitCode(1);
    }
}
await main();
//# sourceMappingURL=cli.js.map