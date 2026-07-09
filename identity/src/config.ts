import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3002),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  JWT_ISSUER: z.string().default("https://identity.travelai.local"),
  JWT_AUDIENCE: z.string().default("travelai-web"),
  JWT_PRIMARY_PRIVATE_KEY: z.string().optional().default(""),
  JWT_SECONDARY_PRIVATE_KEY: z.string().optional().default(""),
  ACCESS_TOKEN_TTL_SEC: z.coerce.number().default(900),
  REFRESH_TOKEN_TTL_SEC: z.coerce.number().default(60 * 60 * 24 * 14),
  LOCKOUT_THRESHOLD: z.coerce.number().default(5),
  LOCKOUT_MINUTES: z.coerce.number().default(15),
  DEMO_USER_EMAIL: z.string().email().default("demo@travelai.local"),
  DEMO_USER_PASSWORD: z.string().min(8).default("DemoTravelAI1!"),
  LOG_LEVEL: z.string().default("info"),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten());
    throw new Error("Invalid identity environment configuration");
  }
  return parsed.data;
}
