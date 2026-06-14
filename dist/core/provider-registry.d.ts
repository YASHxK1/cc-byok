import type { Config } from "./config-schema.js";
export interface ProviderEnvironmentInput {
    baseUrl: string;
    apiKey: string;
    model: string;
}
export interface ProviderDefinition {
    id: string;
    displayName: string;
    defaultBaseUrl: string;
    routingMode: string;
    buildEnvironment(input: ProviderEnvironmentInput): Record<string, string>;
}
export declare function listProviderDefinitions(): ProviderDefinition[];
export declare function getProviderDefinition(id: string): ProviderDefinition;
export declare function requireConfiguredProvider(config: Config, id: string): {
    definition: ProviderDefinition;
    config: {
        baseUrl: string;
    };
};
