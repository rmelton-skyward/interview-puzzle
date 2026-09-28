import dotenv from 'dotenv';
import { z } from 'zod';

export function environmentFileFor(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === 'production' ? '.env.production' : '.env';
}

dotenv.config({ path: environmentFileFor() });

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1).refine((value) => {
    try {
      return ['postgres:', 'postgresql:'].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, 'must be a PostgreSQL connection URL'),
  CORS_ORIGIN: z.string().min(1).default('*'),
  ADMIN_TOKEN: z.string().default(''),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
}).superRefine((environment, context) => {
  if (environment.NODE_ENV !== 'production') {
    return;
  }

  if (environment.ADMIN_TOKEN.trim().length < 32) {
    context.addIssue({
      code: 'custom',
      path: ['ADMIN_TOKEN'],
      message: 'must contain at least 32 characters in production',
    });
  }

  if (environment.CORS_ORIGIN === '*') {
    context.addIssue({
      code: 'custom',
      path: ['CORS_ORIGIN'],
      message: 'must be restricted to trusted origins in production',
    });
  }
});

export function parseEnvironment(source: NodeJS.ProcessEnv = process.env) {
  const result = EnvironmentSchema.safeParse(source);
  if (result.success) {
    return result.data;
  }

  const issues = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const environment = parseEnvironment();