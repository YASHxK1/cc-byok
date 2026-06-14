export interface SecretStore {
    get(provider: string): Promise<string | null>;
    has(provider: string): Promise<boolean>;
    set(provider: string, apiKey: string): Promise<void>;
}
export declare class KeyringSecretStore implements SecretStore {
    get(provider: string): Promise<string | null>;
    has(provider: string): Promise<boolean>;
    set(provider: string, apiKey: string): Promise<void>;
    private entry;
}
