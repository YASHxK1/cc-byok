import type { ProtocolProfile } from "./target-registry.js";
export interface TargetEnvironmentInput {
    baseUrl: string;
    apiKey: string;
    model: string;
    protocol: ProtocolProfile;
}
export declare function buildTargetEnvironment({ baseUrl, apiKey, model, protocol, }: TargetEnvironmentInput): Record<string, string>;
