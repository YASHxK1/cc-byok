import type { LaunchTarget } from "./config-schema.js";
export interface TargetArgumentsInput {
    target: LaunchTarget;
    providerName: string;
    baseUrl: string;
    model: string;
    userArgs: string[];
}
export declare function buildTargetArguments({ target, providerName, baseUrl, model, userArgs, }: TargetArgumentsInput): string[];
