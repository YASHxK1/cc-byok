export interface CodexAppProfileInput {
    codexHome: string;
    providerId: string;
    providerName: string;
    baseUrl: string;
    model: string;
    credentialHelper: string;
}
export declare function configureCodexAppProfile({ codexHome, providerId, providerName, baseUrl, model, credentialHelper, }: CodexAppProfileInput): Promise<void>;
interface CodexConfigValues {
    model: string;
    providerConfigId: string;
    providerName: string;
    baseUrl: string;
    catalogFile: string;
    credentialHelper: string;
    providerId: string;
}
export declare function updateCodexConfig(contents: string, values: CodexConfigValues): string;
export {};
