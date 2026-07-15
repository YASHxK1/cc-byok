import type { AppContext } from "../app-context.js";
export declare function runGatewayLogin(context: AppContext, deviceAuth?: boolean): Promise<void>;
export declare function runGatewayLogout(context: AppContext): Promise<void>;
export declare function runGatewayKey(context: AppContext): Promise<void>;
export declare function runGatewayRotateKey(context: AppContext): Promise<void>;
export declare function runGatewayStart(context: AppContext, options: {
    port?: string | number;
    workspace?: string;
    verbose?: boolean;
}): Promise<void>;
export declare function runGatewayStatus(context: AppContext): Promise<void>;
