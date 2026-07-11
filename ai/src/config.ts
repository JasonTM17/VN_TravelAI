import "dotenv/config";
import { z } from "zod";

const defaultHmacSecret = "travelai_n8n_hmac_dev_secret_change_me";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3003),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  N8N_WEBHOOK_BASE_URL: z.string().default("http://127.0.0.1:5678/webhook"),
  N8N_HMAC_SECRET: z.string().min(16).default(defaultHmacSecret),
  AI_DEGRADED_MODE: z
    .string()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  API_BASE_URL: z.string().default("http://127.0.0.1:3001"),
  IDENTITY_JWKS_URL: z.string().default("http://127.0.0.1:3002/.well-known/jwks.json"),
  IDENTITY_ISSUER: z.string().default("https://identity.travelai.local"),
  IDENTITY_AUDIENCE: z.string().default("travelai-web"),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://127.0.0.1:3000,http://localhost:53000,http://127.0.0.1:53000"),
  /** When set, /metrics requires Bearer or X-Metrics-Token. Empty = open (local). */
  METRICS_TOKEN: z.string().optional().default(""),
  /** Optional: enable direct DeepSeek streaming from ai service */
  DEEPSEEK_API_KEY: z.string().optional().default(""),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),
  DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash"),
  LOG_LEVEL: z.string().default("info"),
}).superRefine((env, ctx) => {
  if (
    env.NODE_ENV === "production" &&
    (env.N8N_HMAC_SECRET === defaultHmacSecret || env.N8N_HMAC_SECRET.length < 32)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["N8N_HMAC_SECRET"],
      message: "N8N_HMAC_SECRET must be explicitly configured with at least 32 characters in production",
    });
  }
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten());
    throw new Error("Invalid ai environment configuration");
  }
  return parsed.data;
}
