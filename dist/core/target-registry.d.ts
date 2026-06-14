import type { Config, LaunchTarget } from "./config-schema.js";
export interface ResolvedTarget {
    target: LaunchTarget;
    builtIn: boolean;
}
export declare function listTargets(config: Config): ResolvedTarget[];
export declare function resolveTarget(config: Config, id: string): ResolvedTarget;
export declare function isBuiltInTarget(id: string): boolean;
