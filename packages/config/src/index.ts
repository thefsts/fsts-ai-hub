/**
 * FSTS AI Hub — Typed, validated runtime configuration.
 *
 * Configuration is validated at startup and fails closed: an invalid or
 * missing required value prevents the service from starting rather than
 * running in an undefined state.
 *
 * Owner: Full Stack Tech & Solutions LLC
 */

import { z } from "zod";

export const ServiceConfigSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SERVICE_NAME: z.string().min(1).max(128),
  AUTH_ISSUER_URL: z.string().url().optional(),
  AUTH_AUDIENCE: z.string().min(1).max(256).optional(),
  AUTH_JWKS_URI: z.string().url().optional(),
  API_HUB_BASE_URL: z.string().url().optional(),
  API_HUB_CREDENTIAL_REF: z.string().min(1).max(256).optional(),
  COMPLIANCE_HUB_BASE_URL: z.string().url().optional(),
  COMPLIANCE_HUB_CREDENTIAL_REF: z.string().min(1).max(256).optional(),
  MODEL_GATEWAY_APPROVED_PROVIDERS: z.string().default(""),
  MODEL_GATEWAY_DEFAULT_CREDENTIAL_REF: z.string().min(1).max(256).optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().min(1).max(128).optional(),
  COMMAND_CENTER_BASE_URL: z.string().url().optional(),
});
export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Parse and validate configuration from an environment-like record.
 * Throws ConfigError on invalid input (fail closed).
 */
export function loadConfig(
  env: Record<string, string | undefined> = process.env,
): ServiceConfig {
  const result = ServiceConfigSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new ConfigError(`Invalid configuration: ${issues}`);
  }
  return result.data;
}

/** Parse the approved-providers list into a normalized array. */
export function approvedProviders(config: ServiceConfig): string[] {
  return config.MODEL_GATEWAY_APPROVED_PROVIDERS.split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}
