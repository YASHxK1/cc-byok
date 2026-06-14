import type { AppContext } from "../app-context.js";
export interface ProviderAddOptions {
    baseUrl?: string;
    displayName?: string;
}
export declare function runProviderAdd(context: AppContext, providerId: string, options?: ProviderAddOptions): Promise<void>;
