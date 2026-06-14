import { z } from "zod";
export declare const providerTypeSchema: z.ZodEnum<{
    "anthropic-compatible": "anthropic-compatible";
    "openai-compatible": "openai-compatible";
    ollama: "ollama";
    "ai-gateway": "ai-gateway";
    custom: "custom";
}>;
export declare const providerConfigSchema: z.ZodObject<{
    displayName: z.ZodString;
    baseUrl: z.ZodURL;
    type: z.ZodEnum<{
        "anthropic-compatible": "anthropic-compatible";
        "openai-compatible": "openai-compatible";
        ollama: "ollama";
        "ai-gateway": "ai-gateway";
        custom: "custom";
    }>;
}, z.core.$strip>;
export declare const v2ConfigSchema: z.ZodObject<{
    activeProvider: z.ZodNullable<z.ZodString>;
    activeModel: z.ZodNullable<z.ZodString>;
    providers: z.ZodRecord<z.ZodString, z.ZodObject<{
        displayName: z.ZodString;
        baseUrl: z.ZodURL;
        type: z.ZodEnum<{
            "anthropic-compatible": "anthropic-compatible";
            "openai-compatible": "openai-compatible";
            ollama: "ollama";
            "ai-gateway": "ai-gateway";
            custom: "custom";
        }>;
    }, z.core.$strip>>;
    version: z.ZodLiteral<2>;
}, z.core.$strip>;
export declare const v3ConfigSchema: z.ZodObject<{
    targets: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    activeProvider: z.ZodNullable<z.ZodString>;
    activeModel: z.ZodNullable<z.ZodString>;
    providers: z.ZodRecord<z.ZodString, z.ZodObject<{
        displayName: z.ZodString;
        baseUrl: z.ZodURL;
        type: z.ZodEnum<{
            "anthropic-compatible": "anthropic-compatible";
            "openai-compatible": "openai-compatible";
            ollama: "ollama";
            "ai-gateway": "ai-gateway";
            custom: "custom";
        }>;
    }, z.core.$strip>>;
    version: z.ZodLiteral<3>;
    activeTarget: z.ZodString;
}, z.core.$strip>;
export declare const configSchema: z.ZodUnion<readonly [z.ZodObject<{
    activeProvider: z.ZodNullable<z.ZodString>;
    activeModel: z.ZodNullable<z.ZodString>;
    providers: z.ZodRecord<z.ZodString, z.ZodObject<{
        displayName: z.ZodString;
        baseUrl: z.ZodURL;
        type: z.ZodEnum<{
            "anthropic-compatible": "anthropic-compatible";
            "openai-compatible": "openai-compatible";
            ollama: "ollama";
            "ai-gateway": "ai-gateway";
            custom: "custom";
        }>;
    }, z.core.$strip>>;
    version: z.ZodLiteral<2>;
}, z.core.$strip>, z.ZodObject<{
    targets: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    activeProvider: z.ZodNullable<z.ZodString>;
    activeModel: z.ZodNullable<z.ZodString>;
    providers: z.ZodRecord<z.ZodString, z.ZodObject<{
        displayName: z.ZodString;
        baseUrl: z.ZodURL;
        type: z.ZodEnum<{
            "anthropic-compatible": "anthropic-compatible";
            "openai-compatible": "openai-compatible";
            ollama: "ollama";
            "ai-gateway": "ai-gateway";
            custom: "custom";
        }>;
    }, z.core.$strip>>;
    version: z.ZodLiteral<3>;
    activeTarget: z.ZodString;
}, z.core.$strip>]>;
export declare const legacyConfigSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    activeProvider: z.ZodNullable<z.ZodString>;
    activeModel: z.ZodNullable<z.ZodString>;
    providers: z.ZodRecord<z.ZodString, z.ZodObject<{
        baseUrl: z.ZodURL;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Config = z.infer<typeof configSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type ProviderType = z.infer<typeof providerTypeSchema>;
