import type { LaunchTarget } from "./target-registry.js";
export interface TargetArgumentsInput {
    target: LaunchTarget;
    providerName: string;
    baseUrl: string;
    model: string;
    restore: boolean;
    userArgs: string[];
}
export declare function buildTargetArguments({ target, providerName, baseUrl, model, restore, userArgs, }: TargetArgumentsInput): string[];
