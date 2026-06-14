import type { LaunchTarget } from "./target-registry.js";
export interface TargetArgumentsInput {
    target: LaunchTarget;
    providerName: string;
    baseUrl: string;
    model: string;
    userArgs: string[];
}
export declare function buildTargetArguments({ target, providerName, baseUrl, model, userArgs, }: TargetArgumentsInput): string[];
