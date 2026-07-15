import { AsyncEntry } from "@napi-rs/keyring";
import { CliError } from "./errors.js";
const SERVICE_NAME = "cc-byok";
export class KeyringSecretStore {
    async get(provider) {
        try {
            return (await this.entry(provider).getPassword()) ?? null;
        }
        catch (error) {
            if (isMissingCredential(error)) {
                return null;
            }
            throw keychainError(error);
        }
    }
    async has(provider) {
        return (await this.get(provider)) !== null;
    }
    async set(provider, apiKey) {
        try {
            await this.entry(provider).setPassword(apiKey);
        }
        catch (error) {
            throw keychainError(error);
        }
    }
    async delete(provider) {
        try {
            await this.entry(provider).deletePassword();
        }
        catch (error) {
            if (!isMissingCredential(error))
                throw keychainError(error);
        }
    }
    entry(provider) {
        return new AsyncEntry(SERVICE_NAME, provider);
    }
}
function isMissingCredential(error) {
    const text = error instanceof Error ? error.message : String(error);
    return /no entry|not found|no matching entry/i.test(text);
}
function keychainError(error) {
    return new CliError("The OS keychain is unavailable. On Linux, ensure a Secret Service provider such as GNOME Keyring or KWallet is installed and unlocked.", "KEYCHAIN_UNAVAILABLE", 1, { cause: error });
}
//# sourceMappingURL=secret-store.js.map