import type { LaunchTarget } from "../core/config-schema.js";
export type NewTarget = Omit<LaunchTarget, "defaultArgs"> & {
    defaultArgs?: string[];
};
export interface PromptService {
    apiKey(providerName: string): Promise<string>;
    confirmReplace(providerName: string): Promise<boolean>;
    customTarget(): Promise<NewTarget>;
}
export declare class InquirerPromptService implements PromptService {
    apiKey(providerName: string): Promise<string>;
    confirmReplace(providerName: string): Promise<boolean>;
    customTarget(): Promise<NewTarget>;
}
