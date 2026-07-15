export type ProtocolProfile = "anthropic" | "openai" | "openai-chat";
export type ArgumentProfile = "codex";
export interface LaunchTarget {
    id: string;
    name: string;
    command: string;
    protocol: ProtocolProfile;
    defaultArgs: string[];
    restoreArgs?: string[];
    argumentProfile?: ArgumentProfile;
}
export declare function listTargets(): LaunchTarget[];
export declare function resolveTarget(id: string): LaunchTarget;
