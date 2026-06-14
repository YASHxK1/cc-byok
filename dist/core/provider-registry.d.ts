import type { Config } from "./config-schema.js";
import type { ProtocolProfile } from "./target-registry.js";
export interface ProviderDefinition {
    id: string;
    displayName: string;
    defaultBaseUrl: string;
    routingMode: string;
    supportedProtocols: ProtocolProfile[];
    resolveBaseUrl(configuredBaseUrl: string, protocol: ProtocolProfile): string;
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
export declare function validateCompatibility(provider: ProviderDefinition, protocol: ProtocolProfile): void;
