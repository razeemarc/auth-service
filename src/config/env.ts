import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  GRPC_PORT: z.coerce.number().int().positive().default(50051),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  OTP_SECRET: z.string().min(32),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_RESEND_SECONDS: z.coerce.number().int().nonnegative().default(60),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  CORS_ORIGIN: z.string().optional(),
});

export const config = envSchema.parse(process.env);
