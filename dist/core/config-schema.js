import { z } from "zod";
export const providerConfigSchema = z.object({
    baseUrl: z.url(),
});
export const configSchema = z.object({
    version: z.literal(1),
    activeProvider: z.string().min(1).nullable(),
    activeModel: z.string().min(1).nullable(),
    providers: z.record(z.string().min(1), providerConfigSchema),
});
//# sourceMappingURL=config-schema.js.map