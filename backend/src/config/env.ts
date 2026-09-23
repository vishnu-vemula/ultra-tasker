import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required (see .env.example)')
    .refine((url) => url.startsWith('postgres'), 'DATABASE_URL must be a postgresql:// connection string'),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  BOOTSTRAP_ADMIN_EMAILS: z.string().default(''),
  SEED_OWNER_UID: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const fields = parsed.error.flatten().fieldErrors;
  console.error('Invalid environment variables:', JSON.stringify(fields, null, 2));
  process.exit(1);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const bootstrapAdminEmails = env.BOOTSTRAP_ADMIN_EMAILS.split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
