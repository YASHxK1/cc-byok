export interface LaunchRequest {
    targetId: string;
    targetName: string;
    command: string;
    args: string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
}
export interface ProcessLauncher {
    launch(request: LaunchRequest): Promise<number>;
}
export declare class ChildProcessLauncher implements ProcessLauncher {
    launch(request: LaunchRequest): Promise<number>;
}
