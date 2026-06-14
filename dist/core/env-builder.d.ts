import type { LaunchTarget } from "./config-schema.js";
export interface EnvironmentInput {
    baseUrl: string;
    apiKey: string | null;
    model: string;
    target: LaunchTarget;
}
export declare function targetNeedsApiKey(target: LaunchTarget): boolean;
export declare function buildTargetEnvironment({ baseUrl, apiKey, model, target, }: EnvironmentInput): Record<string, string>;
