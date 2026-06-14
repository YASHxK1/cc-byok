import { z } from "zod";
export const providerTypeSchema = z.enum([
    "anthropic-compatible",
    "openai-compatible",
    "ollama",
    "ai-gateway",
    "custom",
]);
export const envProfileSchema = z.enum([
    "anthropic",
    "openai",
    "ollama",
    "custom",
]);
export const customEnvMappingSchema = z.object({
    baseUrl: z.string().min(1).optional(),
    apiKey: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
});
export const launchTargetSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    command: z.string().min(1),
    envProfile: envProfileSchema,
    argumentProfile: z.enum(["codex"]).optional(),
    defaultArgs: z.array(z.string()).default([]),
    requiredEnv: z.array(z.string()).optional(),
    customEnvMapping: customEnvMappingSchema.optional(),
});
export const providerConfigSchema = z.object({
    displayName: z.string().min(1),
    baseUrl: z.url(),
    type: providerTypeSchema,
});
export const configSchema = z.object({
    version: z.literal(3),
    activeTarget: z.string().min(1),
    activeProvider: z.string().min(1).nullable(),
    activeModel: z.string().min(1).nullable(),
    providers: z.record(z.string().min(1), providerConfigSchema),
    targets: z.record(z.string().min(1), launchTargetSchema),
});
export const v2ConfigSchema = z.object({
    version: z.literal(2),
    activeProvider: z.string().min(1).nullable(),
    activeModel: z.string().min(1).nullable(),
    providers: z.record(z.string().min(1), z.object({
        displayName: z.string().min(1),
        baseUrl: z.url(),
        type: z.literal("anthropic-compatible"),
    })),
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