import { randomBytes } from "node:crypto";
import type { SecretStore } from "../core/secret-store.js";

export const GATEWAY_PROVIDER_ID = "ai-gateway";

export function generateGatewayKey(): string {
  return randomBytes(32).toString("base64url");
}

export async function ensureGatewayKey(secrets: SecretStore): Promise<string> {
  const existing = await secrets.get(GATEWAY_PROVIDER_ID);
  if (existing) return existing;
  const key = generateGatewayKey();
  await secrets.set(GATEWAY_PROVIDER_ID, key);
  return key;
}
