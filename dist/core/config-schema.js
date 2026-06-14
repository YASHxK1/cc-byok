import { z } from "zod";
export const providerConfigSchema = z.object({
    displayName: z.string().min(1),
    baseUrl: z.url(),
    type: z.literal("anthropic-compatible"),
});
export const configSchema = z.object({
    version: z.literal(2),
    activeProvider: z.string().min(1).nullable(),
    activeModel: z.string().min(1).nullable(),
    providers: z.record(z.string().min(1), providerConfigSchema),
});
export const legacyConfigSchema = z.object({
    version: z.literal(1),
    activeProvider: z.string().min(1).nullable(),
    activeModel: z.string().min(1).nullable(),
    providers: z.record(z.string().min(1), z.object({
        baseUrl: z.url(),
    })),
});
//# sourceMappingURL=config-schema.js.map