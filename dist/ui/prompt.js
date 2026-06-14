import { confirm, input, password, select } from "@inquirer/prompts";
import { CliError } from "../core/errors.js";
export class InquirerPromptService {
    async apiKey(providerName) {
        try {
            return await password({
                message: `Enter ${providerName} API key:`,
                mask: "*",
                validate(value) {
                    return value.trim().length > 0 || "API key cannot be empty.";
                },
            });
        }
        catch (error) {
            throw promptError(error);
        }
    }
    async confirmReplace(providerName) {
        try {
            return await confirm({
                message: `Replace the stored ${providerName} API key?`,
                default: false,
            });
        }
        catch (error) {
            throw promptError(error);
        }
    }
    async customTarget() {
        try {
            const id = await requiredInput("Target ID:");
            const name = await requiredInput("Display name:");
            const command = await requiredInput("Command to execute:");
            const description = (await input({ message: "Description:" })).trim();
            const envProfile = await select({
                message: "Environment profile:",
                choices: [
                    { name: "Anthropic-compatible", value: "anthropic" },
                    { name: "OpenAI-compatible", value: "openai" },
                    { name: "Ollama", value: "ollama" },
                    { name: "Custom environment variables", value: "custom" },
                ],
            });
            const customEnvMapping = envProfile === "custom"
                ? {
                    baseUrl: await optionalInput("Base URL environment variable:"),
                    apiKey: await optionalInput("API key environment variable:"),
                    model: await optionalInput("Model environment variable:"),
                }
                : undefined;
            return {
                id: id.trim().toLowerCase(),
                name: name.trim(),
                command: command.trim(),
                description: description || undefined,
                envProfile,
                defaultArgs: [],
                customEnvMapping,
            };
        }
        catch (error) {
            throw promptError(error);
        }
    }
}
async function requiredInput(message) {
    return input({
        message,
        validate(value) {
            return value.trim().length > 0 || "A value is required.";
        },
    });
}
async function optionalInput(message) {
    const value = (await input({ message })).trim();
    return value || undefined;
}
function promptError(error) {
    if (error instanceof Error &&
        (error.name === "ExitPromptError"
            || /force closed|user force closed/i.test(error.message))) {
        return new CliError("Cancelled.", "CANCELLED", 0, { cause: error });
    }
    throw error;
}
//# sourceMappingURL=prompt.js.map