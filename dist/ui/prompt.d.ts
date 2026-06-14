export interface PromptService {
    apiKey(providerName: string): Promise<string>;
    confirmReplace(providerName: string): Promise<boolean>;
}
export declare class InquirerPromptService implements PromptService {
    apiKey(providerName: string): Promise<string>;
    confirmReplace(providerName: string): Promise<boolean>;
}
