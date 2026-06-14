export interface AppPaths {
    configDir: string;
    configFile: string;
}
export declare function getAppPaths(env?: NodeJS.ProcessEnv): AppPaths;
