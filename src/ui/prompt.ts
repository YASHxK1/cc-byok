import { confirm, password } from "@inquirer/prompts";
import { CliError } from "../core/errors.js";

export interface PromptService {
  apiKey(providerName: string): Promise<string>;
  confirmReplace(providerName: string): Promise<boolean>;
}

export class InquirerPromptService implements PromptService {
  async apiKey(providerName: string): Promise<string> {
    try {
      return await password({
        message: `Enter ${providerName} API key:`,
        mask: "*",
        validate(value) {
          return value.trim().length > 0 || "API key cannot be empty.";
        },
      });
    } catch (error) {
      throw promptError(error);
    }
  }

  async confirmReplace(providerName: string): Promise<boolean> {
    try {
      return await confirm({
        message: `Replace the stored ${providerName} API key?`,
        default: false,
      });
    } catch (error) {
      throw promptError(error);
    }
  }
}

function promptError(error: unknown): CliError {
  if (
    error instanceof Error &&
    (error.name === "ExitPromptError" || /force closed|user force closed/i.test(error.message))
  ) {
    return new CliError("Cancelled.", "CANCELLED", 0, { cause: error });
  }
  throw error;
}
