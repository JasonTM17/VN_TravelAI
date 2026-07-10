import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3003),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  N8N_WEBHOOK_BASE_URL: z.string().default("http://127.0.0.1:5678/webhook"),
  N8N_HMAC_SECRET: z.string().min(8).default("travelai_n8n_hmac_dev_secret_change_me"),
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
  LOG_LEVEL: z.string().default("info"),
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
