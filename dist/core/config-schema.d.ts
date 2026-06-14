import { z } from "zod";
export declare const providerTypeSchema: z.ZodEnum<{
    "anthropic-compatible": "anthropic-compatible";
    "openai-compatible": "openai-compatible";
    ollama: "ollama";
    "ai-gateway": "ai-gateway";
    custom: "custom";
}>;
export declare const envProfileSchema: z.ZodEnum<{
    ollama: "ollama";
    custom: "custom";
    anthropic: "anthropic";
    openai: "openai";
}>;
export declare const customEnvMappingSchema: z.ZodObject<{
    baseUrl: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const launchTargetSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    command: z.ZodString;
    envProfile: z.ZodEnum<{
        ollama: "ollama";
        custom: "custom";
        anthropic: "anthropic";
        openai: "openai";
    }>;
    argumentProfile: z.ZodOptional<z.ZodEnum<{
        codex: "codex";
    }>>;
    defaultArgs: z.ZodDefault<z.ZodArray<z.ZodString>>;
    requiredEnv: z.ZodOptional<z.ZodArray<z.ZodString>>;
    customEnvMapping: z.ZodOptional<z.ZodObject<{
        baseUrl: z.ZodOptional<z.ZodString>;
        apiKey: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
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
export declare const configSchema: z.ZodObject<{
    version: z.ZodLiteral<3>;
    activeTarget: z.ZodString;
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
    targets: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        command: z.ZodString;
        envProfile: z.ZodEnum<{
            ollama: "ollama";
            custom: "custom";
            anthropic: "anthropic";
            openai: "openai";
        }>;
        argumentProfile: z.ZodOptional<z.ZodEnum<{
            codex: "codex";
        }>>;
        defaultArgs: z.ZodDefault<z.ZodArray<z.ZodString>>;
        requiredEnv: z.ZodOptional<z.ZodArray<z.ZodString>>;
        customEnvMapping: z.ZodOptional<z.ZodObject<{
            baseUrl: z.ZodOptional<z.ZodString>;
            apiKey: z.ZodOptional<z.ZodString>;
            model: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const v2ConfigSchema: z.ZodObject<{
    version: z.ZodLiteral<2>;
    activeProvider: z.ZodNullable<z.ZodString>;
    activeModel: z.ZodNullable<z.ZodString>;
    providers: z.ZodRecord<z.ZodString, z.ZodObject<{
        displayName: z.ZodString;
        baseUrl: z.ZodURL;
        type: z.ZodLiteral<"anthropic-compatible">;
    }, z.core.$strip>>;
}, z.core.$strip>;
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
export type EnvProfile = z.infer<typeof envProfileSchema>;
export type LaunchTarget = z.infer<typeof launchTargetSchema>;
export type CustomEnvMapping = z.infer<typeof customEnvMappingSchema>;
