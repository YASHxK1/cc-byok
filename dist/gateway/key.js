import { randomBytes } from "node:crypto";
export const GATEWAY_PROVIDER_ID = "ai-gateway";
export function generateGatewayKey() {
    return randomBytes(32).toString("base64url");
}
export async function ensureGatewayKey(secrets) {
    const existing = await secrets.get(GATEWAY_PROVIDER_ID);
    if (existing)
        return existing;
    const key = generateGatewayKey();
    await secrets.set(GATEWAY_PROVIDER_ID, key);
    return key;
}
//# sourceMappingURL=key.js.map