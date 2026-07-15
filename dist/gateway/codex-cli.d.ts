export declare const MIN_CODEX_VERSION = "0.144.4";
export interface CodexInfo {
    available: boolean;
    version: string | null;
    supported: boolean;
}
export declare function inspectCodex(env?: NodeJS.ProcessEnv): Promise<CodexInfo>;
export declare function requireCodex(env?: NodeJS.ProcessEnv): Promise<string>;
export declare function codexLoginStatus(env?: NodeJS.ProcessEnv): Promise<boolean>;
export declare function runCodexCommand(args: string[], env?: NodeJS.ProcessEnv): Promise<number>;
