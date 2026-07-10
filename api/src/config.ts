import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  MEILI_HOST: z.string().default("http://127.0.0.1:7700"),
  MEILI_MASTER_KEY: z.string().default("travelai_meili_dev_key_change_me"),
  IDENTITY_JWKS_URL: z.string().default("http://127.0.0.1:3002/.well-known/jwks.json"),
  IDENTITY_ISSUER: z.string().default("https://identity.travelai.local"),
  IDENTITY_AUDIENCE: z.string().default("travelai-web"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  /** When set, /metrics requires Bearer or X-Metrics-Token. Empty = open (local). */
  METRICS_TOKEN: z.string().optional().default(""),
  LOG_LEVEL: z.string().default("info"),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten());
    throw new Error("Invalid api environment configuration");
  }
  return parsed.data;
}
