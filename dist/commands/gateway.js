import { resolve } from "node:path";
import { CliError } from "../core/errors.js";
import { AI_GATEWAY } from "../providers/ai-gateway.js";
import { codexLoginStatus, inspectCodex, requireCodex, runCodexCommand } from "../gateway/codex-cli.js";
import { ensureGatewayKey, generateGatewayKey, GATEWAY_PROVIDER_ID } from "../gateway/key.js";
import { createGatewayServer } from "../gateway/server.js";
export async function runGatewayLogin(context, deviceAuth = false) {
    const code = await runCodexCommand(["login", ...(deviceAuth ? ["--device-auth"] : [])], context.env);
    context.setExitCode(code);
}
export async function runGatewayLogout(context) {
    const code = await runCodexCommand(["logout"], context.env);
    context.setExitCode(code);
}
export async function runGatewayKey(context) {
    const key = await ensureGatewayKey(context.secrets);
    context.output.log(key);
}
export async function runGatewayRotateKey(context) {
    const key = generateGatewayKey();
    await context.secrets.set(GATEWAY_PROVIDER_ID, key);
    context.output.log("Gateway bearer key rotated. Existing clients must be updated.");
}
export async function runGatewayStart(context, options) {
    const port = parsePort(options.port ?? 3000);
    const workspace = resolve(context.cwd, options.workspace ?? ".");
    const version = await requireCodex(context.env);
    if (!(await codexLoginStatus(context.env)))
        throw new CliError('Codex is not logged in. Run "cc-byok gateway login".', "CODEX_UNAVAILABLE");
    const key = await ensureGatewayKey(context.secrets);
    const initialized = await context.config.initialize();
    const baseUrl = `http://127.0.0.1:${port}/v1`;
    const provider = initialized.config.providers[GATEWAY_PROVIDER_ID];
    if (provider?.baseUrl !== baseUrl)
        await context.config.write({ ...initialized.config, providers: { ...initialized.config.providers, [GATEWAY_PROVIDER_ID]: { displayName: AI_GATEWAY.displayName, baseUrl, type: "openai-compatible" } } });
    const { app, runtime } = createGatewayServer({ key, workspace, codexVersion: version, verbose: options.verbose });
    await runtime.start();
    try {
        await app.listen({ host: "127.0.0.1", port });
    }
    catch (error) {
        await runtime.stop();
        throw new CliError(`Could not start gateway on 127.0.0.1:${port}: ${error instanceof Error ? error.message : String(error)}`, "GATEWAY_UNAVAILABLE");
    }
    context.output.log(`AI Gateway listening at ${baseUrl}`);
    context.output.log('Press Ctrl+C to stop. Run "cc-byok gateway key" to display the bearer key.');
    await new Promise((resolveDone) => {
        const shutdown = () => { process.off("SIGINT", shutdown); process.off("SIGTERM", shutdown); void app.close().then(() => runtime.stop()).finally(resolveDone); };
        process.once("SIGINT", shutdown);
        process.once("SIGTERM", shutdown);
    });
}
export async function runGatewayStatus(context) {
    const codex = await inspectCodex(context.env);
    const loggedIn = codex.available ? await codexLoginStatus(context.env) : false;
    const config = await context.config.initialize();
    const endpoint = config.config.providers[GATEWAY_PROVIDER_ID]?.baseUrl ?? AI_GATEWAY.defaultBaseUrl;
    const key = await context.secrets.get(GATEWAY_PROVIDER_ID);
    let health = "unavailable";
    if (key) {
        try {
            const response = await fetch(`${endpoint.replace(/\/$/, "")}/status`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(1000) });
            health = response.ok ? "healthy" : `HTTP ${response.status}`;
        }
        catch { }
    }
    context.output.log(`Codex: ${codex.available ? `${codex.version ?? "unknown"}${codex.supported ? "" : " (upgrade required)"}` : "not found"}`);
    context.output.log(`Codex login: ${loggedIn ? "authenticated" : "not authenticated"}`);
    context.output.log(`Endpoint: ${endpoint}`);
    context.output.log(`Bearer key: ${key ? "stored" : "not created"}`);
    context.output.log(`HTTP health: ${health}`);
}
function parsePort(value) { const port = Number(value); if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new CliError(`Invalid gateway port "${value}".`, "INVALID_INPUT"); return port; }
//# sourceMappingURL=gateway.js.map