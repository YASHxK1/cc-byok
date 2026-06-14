import { type Config } from "./config-schema.js";
import type { AppPaths } from "./paths.js";
export interface ConfigStore {
    exists(): Promise<boolean>;
    initialize(): Promise<{
        created: boolean;
        config: Config;
    }>;
    read(): Promise<Config>;
    write(config: Config): Promise<void>;
}
export declare function createDefaultConfig(): Config;
export declare class FileConfigStore implements ConfigStore {
    private readonly paths;
    constructor(paths: AppPaths);
    exists(): Promise<boolean>;
    initialize(): Promise<{
        created: boolean;
        config: Config;
    }>;
    read(): Promise<Config>;
    write(config: Config): Promise<void>;
}
