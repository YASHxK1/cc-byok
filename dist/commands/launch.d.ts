import type { AppContext } from "../app-context.js";
export interface LaunchOptions {
    provider?: string;
    model?: string;
    restore?: boolean;
}
export declare function runLaunch(context: AppContext, targetId: string | undefined, targetArgs: string[], options?: LaunchOptions): Promise<void>;
