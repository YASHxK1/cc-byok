import type { AppContext } from "../app-context.js";
export declare function runCatalogAdd(context: AppContext, modelId: string): Promise<void>;
export declare function runCatalogRemove(context: AppContext, modelId: string): Promise<void>;
export declare function runCatalogList(context: AppContext): Promise<void>;
