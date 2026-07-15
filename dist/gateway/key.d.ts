import type { SecretStore } from "../core/secret-store.js";
export declare const GATEWAY_PROVIDER_ID = "ai-gateway";
export declare function generateGatewayKey(): string;
export declare function ensureGatewayKey(secrets: SecretStore): Promise<string>;
