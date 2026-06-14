import type { Config, EnvProfile, ProviderType } from "./config-schema.js";
export interface ProviderDefinition {
    id: string;
    displayName: string;
    defaultBaseUrl: string;
    type: ProviderType;
    routingMode: string;
    supportedProfiles: EnvProfile[];
    resolveBaseUrl(configuredBaseUrl: string, profile: EnvProfile): string;
}
export declare function listProviderDefinitions(): ProviderDefinition[];
export declare function getProviderDefinition(id: string): ProviderDefinition;
export declare function requireConfiguredProvider(config: Config, id: string): {
    definition: ProviderDefinition;
    config: {
        displayName: string;
        baseUrl: string;
        type: "anthropic-compatible" | "openai-compatible" | "ollama" | "ai-gateway" | "custom";
    };
};
export declare function isBuiltInProvider(id: string): boolean;
export declare function getBuiltInProvider(id: string): ProviderDefinition | null;
export declare function validateCompatibility(provider: ProviderDefinition, profile: EnvProfile): {
    compatible: boolean;
    unknown: boolean;
    message?: string;
};
