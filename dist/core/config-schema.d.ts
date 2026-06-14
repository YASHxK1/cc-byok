import { z } from "zod";
export declare const providerConfigSchema: z.ZodObject<{
    baseUrl: z.ZodURL;
}, z.core.$strip>;
export declare const configSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    activeProvider: z.ZodNullable<z.ZodString>;
    activeModel: z.ZodNullable<z.ZodString>;
    providers: z.ZodRecord<z.ZodString, z.ZodObject<{
        baseUrl: z.ZodURL;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type Config = z.infer<typeof configSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
