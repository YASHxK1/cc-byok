import { z } from "zod";

export const providerTypeSchema = z.enum([
  "anthropic-compatible",
  "openai-compatible",
  "ollama",
  "ai-gateway",
  "custom",
]);

export const providerConfigSchema = z.object({
  displayName: z.string().min(1),
  baseUrl: z.url(),
  type: providerTypeSchema,
});

const configFields = {
  activeProvider: z.string().min(1).nullable(),
  activeModel: z.string().min(1).nullable(),
  providers: z.record(z.string().min(1), providerConfigSchema),
};

export const v2ConfigSchema = z.object({
  version: z.literal(2),
  ...configFields,
});

export const v3ConfigSchema = z.object({
  version: z.literal(3),
  activeTarget: z.string().min(1),
  ...configFields,
  targets: z.record(z.string().min(1), z.unknown()),
});

export const configSchema = z.union([v2ConfigSchema, v3ConfigSchema]);

export const legacyConfigSchema = z.object({
  version: z.literal(1),
  activeProvider: z.string().min(1).nullable(),
  activeModel: z.string().min(1).nullable(),
  providers: z.record(
    z.string().min(1),
    z.object({
      baseUrl: z.url(),
    }),
  ),
});

export type Config = z.infer<typeof configSchema>;
export type ProviderConfig = z.infer<typeof providerConfigSchema>;
export type ProviderType = z.infer<typeof providerTypeSchema>;
