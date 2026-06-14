export interface LaunchRequest {
    args: string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
}
export interface ProcessLauncher {
    launch(request: LaunchRequest): Promise<number>;
}
export declare class ClaudeProcessLauncher implements ProcessLauncher {
    launch(request: LaunchRequest): Promise<number>;
}
