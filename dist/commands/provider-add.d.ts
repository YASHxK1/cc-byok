import type { AppContext } from "../app-context.js";
import { type ProviderType } from "../core/config-schema.js";
export interface ProviderAddOptions {
    baseUrl?: string;
    displayName?: string;
    type?: ProviderType;
}
export declare function runProviderAdd(context: AppContext, providerId: string, options?: ProviderAddOptions): Promise<void>;
export declare function parseProviderType(value: string): ProviderType;
