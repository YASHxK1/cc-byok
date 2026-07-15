import { AsyncEntry } from "@napi-rs/keyring";
import { CliError } from "./errors.js";

const SERVICE_NAME = "cc-byok";

export interface SecretStore {
  get(provider: string): Promise<string | null>;
  has(provider: string): Promise<boolean>;
  set(provider: string, apiKey: string): Promise<void>;
  delete?(provider: string): Promise<void>;
}

export class KeyringSecretStore implements SecretStore {
  async get(provider: string): Promise<string | null> {
    try {
      return (await this.entry(provider).getPassword()) ?? null;
    } catch (error) {
      if (isMissingCredential(error)) {
        return null;
      }
      throw keychainError(error);
    }
  }

  async has(provider: string): Promise<boolean> {
    return (await this.get(provider)) !== null;
  }

  async set(provider: string, apiKey: string): Promise<void> {
    try {
      await this.entry(provider).setPassword(apiKey);
    } catch (error) {
      throw keychainError(error);
    }
  }

  async delete(provider: string): Promise<void> {
    try {
      await this.entry(provider).deletePassword();
    } catch (error) {
      if (!isMissingCredential(error)) throw keychainError(error);
    }
  }

  private entry(provider: string): AsyncEntry {
    return new AsyncEntry(SERVICE_NAME, provider);
  }
}

function isMissingCredential(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return /no entry|not found|no matching entry/i.test(text);
}

function keychainError(error: unknown): CliError {
  return new CliError(
    "The OS keychain is unavailable. On Linux, ensure a Secret Service provider such as GNOME Keyring or KWallet is installed and unlocked.",
    "KEYCHAIN_UNAVAILABLE",
    1,
    { cause: error },
  );
}
