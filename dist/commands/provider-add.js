import { CliError } from "../core/errors.js";
import { getBuiltInProvider, isBuiltInProvider, requireConfiguredProvider, } from "../core/provider-registry.js";
import { ensureGatewayKey, GATEWAY_PROVIDER_ID } from "../gateway/key.js";
export async function runProviderAdd(context, providerId, options = {}) {
    const cleanProviderId = providerId.trim().toLowerCase();
    validateProviderId(cleanProviderId);
    if (cleanProviderId === GATEWAY_PROVIDER_ID) {
        if (options.baseUrl || options.displayName)
            throw new CliError(`Built-in provider "${cleanProviderId}" has managed settings and does not accept custom URL or display-name options.`, "INVALID_INPUT");
        await ensureGatewayKey(context.secrets);
        context.output.log('AI Gateway local bearer key initialized. Run "cc-byok gateway start" before launching OpenCode.');
        return;
    }
    let config = await context.config.read();
    const builtIn = getBuiltInProvider(cleanProviderId);
    const existing = config.providers[cleanProviderId];
    if (!builtIn && !existing) {
        if (!options.baseUrl) {
            throw new CliError(`Custom provider "${cleanProviderId}" requires --base-url <url>. The gateway must implement the Anthropic Messages API.`, "INVALID_INPUT");
        }
        const baseUrl = validateBaseUrl(options.baseUrl);
        config = {
            ...config,
            providers: {
                ...config.providers,
                [cleanProviderId]: {
                    displayName: options.displayName?.trim() || cleanProviderId,
                    baseUrl,
                    type: "anthropic-compatible",
                },
            },
        };
    }
    else if (isBuiltInProvider(cleanProviderId) &&
        (options.baseUrl || options.displayName)) {
        throw new CliError(`Built-in provider "${cleanProviderId}" has managed settings and does not accept custom URL or display-name options.`, "INVALID_INPUT");
    }
    else if (existing && (options.baseUrl || options.displayName)) {
        const baseUrl = options.baseUrl
            ? validateBaseUrl(options.baseUrl)
            : existing.baseUrl;
        config = {
            ...config,
            providers: {
                ...config.providers,
                [cleanProviderId]: {
                    ...existing,
                    displayName: options.displayName?.trim() || existing.displayName,
                    baseUrl,
                },
            },
        };
    }
    const provider = requireConfiguredProvider(config, cleanProviderId).definition;
    if (await context.secrets.has(cleanProviderId)) {
        const replace = await context.prompts.confirmReplace(provider.displayName);
        if (!replace) {
            throw new CliError("Cancelled. The stored API key was not changed.", "CANCELLED", 0);
        }
    }
    const apiKey = (await context.prompts.apiKey(provider.displayName)).trim();
    if (!apiKey) {
        throw new CliError("API key cannot be empty.", "INVALID_INPUT");
    }
    await context.secrets.set(cleanProviderId, apiKey);
    if (!existing || options.baseUrl || options.displayName) {
        await context.config.write(config);
    }
    context.output.log(`${provider.displayName} API key saved securely.`);
}
function validateProviderId(providerId) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(providerId)) {
        throw new CliError("Provider ID must contain only lowercase letters, numbers, and hyphens.", "INVALID_INPUT");
    }
}
function validateBaseUrl(value) {
    let url;
    try {
        url = new URL(value);
    }
    catch {
        throw new CliError(`Invalid gateway base URL "${value}".`, "INVALID_INPUT");
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new CliError("Gateway base URL must use http:// or https://.", "INVALID_INPUT");
    }
    return url.toString().replace(/\/$/, "");
}
//# sourceMappingURL=provider-add.js.map