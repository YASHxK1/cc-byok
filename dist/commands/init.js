export async function runInit(context) {
    const result = await context.config.initialize();
    context.output.log(result.created
        ? `Initialized cc-byok at ${context.paths.configFile}`
        : `cc-byok is already initialized at ${context.paths.configFile}`);
}
//# sourceMappingURL=init.js.map