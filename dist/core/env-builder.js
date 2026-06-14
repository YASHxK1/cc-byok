import { CliError } from "./errors.js";
export function targetNeedsApiKey(target) {
    return target.envProfile === "anthropic"
        || target.envProfile === "openai"
        || (target.envProfile === "custom"
            && Boolean(target.customEnvMapping?.apiKey));
}
export function buildTargetEnvironment({ baseUrl, apiKey, model, target, }) {
    if (targetNeedsApiKey(target) && !apiKey) {
        throw new CliError("An API key is required for this target.", "MISSING_KEY");
    }
    switch (target.envProfile) {
        case "anthropic":
            return {
                ANTHROPIC_BASE_URL: baseUrl,
                ANTHROPIC_AUTH_TOKEN: apiKey ?? "",
                ANTHROPIC_API_KEY: "",
                ANTHROPIC_MODEL: model,
            };
        case "openai":
            return {
                OPENAI_BASE_URL: baseUrl,
                OPENAI_API_KEY: apiKey ?? "",
                OPENAI_MODEL: model,
            };
        case "ollama":
            return {
                OLLAMA_HOST: baseUrl,
                MODEL: model,
            };
        case "custom":
            return buildCustomEnvironment(baseUrl, apiKey, model, target);
    }
}
function buildCustomEnvironment(baseUrl, apiKey, model, target) {
    const mapping = target.customEnvMapping;
    if (!mapping) {
        throw new CliError(`Custom target "${target.id}" does not define environment variable mappings.`, "INVALID_CONFIG");
    }
    const environment = {};
    if (mapping.baseUrl)
        environment[mapping.baseUrl] = baseUrl;
    if (mapping.apiKey)
        environment[mapping.apiKey] = apiKey ?? "";
    if (mapping.model)
        environment[mapping.model] = model;
    return environment;
}
//# sourceMappingURL=env-builder.js.map