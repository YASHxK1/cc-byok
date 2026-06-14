import { constants } from "node:fs";
import { access, copyFile, mkdir, readFile, rename, rm, writeFile, } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
const MANAGED_BLOCK_START = "# cc-byok:begin";
const MANAGED_BLOCK_END = "# cc-byok:end";
export async function configureCodexAppProfile({ codexHome, providerId, providerName, baseUrl, model, credentialHelper, }) {
    const configFile = join(codexHome, "config.toml");
    const catalogFile = join(codexHome, "cc-byok-models.json");
    const backupFile = join(codexHome, "config.toml.cc-byok.bak");
    const providerConfigId = "cc_byok";
    await mkdir(codexHome, { recursive: true });
    const existingConfig = await readOptionalFile(configFile);
    if (existingConfig !== null && !(await exists(backupFile))) {
        await copyFile(configFile, backupFile, constants.COPYFILE_EXCL);
    }
    const nextConfig = updateCodexConfig(existingConfig ?? "", {
        model,
        providerConfigId,
        providerName,
        baseUrl,
        catalogFile,
        credentialHelper,
        providerId,
    });
    await atomicWrite(configFile, nextConfig);
    await atomicWrite(catalogFile, `${JSON.stringify(createModelCatalog(model), null, 2)}\n`);
}
export function updateCodexConfig(contents, values) {
    const newline = contents.includes("\r\n") ? "\r\n" : "\n";
    const lines = removeManagedBlock(contents).split(/\r?\n/);
    if (lines.at(-1) === "") {
        lines.pop();
    }
    setTopLevelValue(lines, "model", tomlString(values.model));
    setTopLevelValue(lines, "model_provider", tomlString(values.providerConfigId));
    setTopLevelValue(lines, "model_catalog_json", tomlString(values.catalogFile));
    while (lines.at(-1)?.trim() === "") {
        lines.pop();
    }
    lines.push("", MANAGED_BLOCK_START, `[model_providers.${values.providerConfigId}]`, `name = ${tomlString(values.providerName)}`, `base_url = ${tomlString(values.baseUrl)}`, 'wire_api = "responses"', "", `[model_providers.${values.providerConfigId}.auth]`, `command = ${tomlString(process.execPath)}`, `args = [${tomlString(values.credentialHelper)}, ${tomlString(values.providerId)}]`, "timeout_ms = 5000", "refresh_interval_ms = 0", MANAGED_BLOCK_END);
    return `${lines.join(newline)}${newline}`;
}
function setTopLevelValue(lines, key, serializedValue) {
    const firstTable = lines.findIndex((line) => /^\s*\[/.test(line));
    const topLevelEnd = firstTable === -1 ? lines.length : firstTable;
    const matcher = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=`);
    const existingIndex = lines
        .slice(0, topLevelEnd)
        .findIndex((line) => matcher.test(line));
    const line = `${key} = ${serializedValue}`;
    if (existingIndex >= 0) {
        lines[existingIndex] = line;
        return;
    }
    lines.unshift(line);
}
function removeManagedBlock(contents) {
    const start = contents.indexOf(MANAGED_BLOCK_START);
    if (start < 0) {
        return contents;
    }
    const end = contents.indexOf(MANAGED_BLOCK_END, start);
    if (end < 0) {
        return contents.slice(0, start);
    }
    return `${contents.slice(0, start)}${contents.slice(end + MANAGED_BLOCK_END.length)}`;
}
function createModelCatalog(model) {
    return {
        models: [
            {
                base_instructions: "",
                context_window: 128000,
                default_verbosity: "low",
                display_name: model,
                experimental_supported_tools: [],
                input_modalities: ["text"],
                priority: 0,
                shell_type: "default",
                slug: model,
                support_verbosity: true,
                supported_in_api: true,
                supported_reasoning_levels: [],
                supports_parallel_tool_calls: true,
                supports_reasoning_summaries: false,
                truncation_policy: {
                    limit: 10000,
                    mode: "bytes",
                },
                visibility: "list",
            },
        ],
    };
}
async function atomicWrite(path, contents) {
    const directory = dirname(path);
    const tempFile = join(directory, `.${basename(path)}.${randomUUID()}.tmp`);
    try {
        await writeFile(tempFile, contents, { encoding: "utf8", flag: "wx" });
        await rename(tempFile, path);
    }
    catch (error) {
        await rm(tempFile, { force: true }).catch(() => undefined);
        throw error;
    }
}
async function readOptionalFile(path) {
    try {
        return await readFile(path, "utf8");
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }
        throw error;
    }
}
async function exists(path) {
    try {
        await access(path, constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
function tomlString(value) {
    return JSON.stringify(value);
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
//# sourceMappingURL=codex-app-profile.js.map