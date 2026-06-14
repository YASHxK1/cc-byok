export function buildTargetArguments({ target, providerName, baseUrl, model, userArgs, }) {
    const routingArgs = target.argumentProfile === "codex"
        ? buildCodexArguments(providerName, baseUrl, model)
        : [];
    return [...target.defaultArgs, ...routingArgs, ...userArgs];
}
function buildCodexArguments(providerName, baseUrl, model) {
    const providerId = "cc_byok";
    return [
        "-c",
        `model=${tomlString(model)}`,
        "-c",
        `model_provider=${tomlString(providerId)}`,
        "-c",
        `model_providers.${providerId}.name=${tomlString(providerName)}`,
        "-c",
        `model_providers.${providerId}.base_url=${tomlString(baseUrl)}`,
        "-c",
        `model_providers.${providerId}.env_key="OPENAI_API_KEY"`,
        "-c",
        `model_providers.${providerId}.wire_api="responses"`,
    ];
}
function tomlString(value) {
    return JSON.stringify(value);
}
//# sourceMappingURL=argument-builder.js.map