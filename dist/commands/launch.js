import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTargetArguments } from "../core/argument-builder.js";
import { configureCodexAppProfile } from "../core/codex-app-profile.js";
import { buildTargetEnvironment } from "../core/env-builder.js";
import { CliError } from "../core/errors.js";
import { requireConfiguredProvider, validateCompatibility, } from "../core/provider-registry.js";
import { resolveTarget } from "../core/target-registry.js";
export async function runLaunch(context, targetId, targetArgs, options = {}) {
    const config = await context.config.read();
    const providerId = options.provider?.trim() || config.activeProvider;
    const model = options.model?.trim() || config.activeModel;
    if (!providerId) {
        throw new CliError('No active provider is selected. Run "cc-byok use <provider-id> <model-id>" or pass --provider and --model.', "MISSING_PROVIDER");
    }
    if (!model) {
        throw new CliError(`No active model is selected. Run "cc-byok use ${providerId} <model-id>" or pass --provider and --model.`, "MISSING_MODEL");
    }
    const target = resolveTarget(targetId ?? "claude");
    const restore = options.restore ?? false;
    if (restore && !target.restoreArgs) {
        throw new CliError(`${target.name} does not support delegated restore through cc-byok. Run "cc-byok launch ${target.id} -- <target arguments...>" to pass target-specific arguments directly.`, "UNSUPPORTED_RESTORE");
    }
    const provider = requireConfiguredProvider(config, providerId);
    validateCompatibility(provider.definition, target.protocol);
    const apiKey = await context.secrets.get(providerId);
    if (!apiKey) {
        throw new CliError(`No API key is stored for ${provider.definition.displayName}. Run "cc-byok provider add ${providerId}".`, "MISSING_KEY");
    }
    const baseUrl = provider.definition.resolveBaseUrl(provider.config.baseUrl, target.protocol);
    const targetEnvironment = buildTargetEnvironment({
        baseUrl,
        apiKey,
        model,
        protocol: target.protocol,
    });
    if (target.id === "codex-app") {
        const codexHome = context.env.CODEX_HOME?.trim() || join(homedir(), ".codex");
        const credentialHelper = fileURLToPath(new URL("../credential-helper.js", import.meta.url));
        await configureCodexAppProfile({
            codexHome,
            providerId,
            providerName: provider.definition.displayName,
            baseUrl,
            model,
            credentialHelper,
        });
    }
    context.output.log(`Launching ${target.name} with ${provider.definition.displayName} (${model})...`);
    const exitCode = await context.launcher.launch({
        targetId: target.id,
        targetName: target.name,
        command: target.command,
        args: buildTargetArguments({
            target,
            providerName: provider.definition.displayName,
            baseUrl,
            model,
            restore,
            userArgs: targetArgs,
        }),
        cwd: context.cwd,
        env: {
            ...context.env,
            ...targetEnvironment,
        },
    });
    context.setExitCode(exitCode);
}
//# sourceMappingURL=launch.js.map