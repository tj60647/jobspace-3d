import { z } from 'zod';

const configSchema = z.object({
  DATABASE_URL: z.string(),
  EMBEDDING_PROVIDER: z.enum(['openai', 'stub']).default('stub'),
  OPENAI_API_KEY: z.string().optional(),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-large'),
  ADMIN_TOKEN: z.string().default('admin-token-changeme'),
  GREENHOUSE_BOARDS: z.string().optional(),
  LEVER_COMPANIES: z.string().optional(),
  ASHBY_ORGS: z.string().optional(),
  RECRUITEE_CLIENTS: z.string().optional(),
  SMARTRECRUITERS_COMPANY: z.string().optional(),
  SMARTRECRUITERS_TOKEN: z.string().optional(),
  PORT: z.string().transform(Number).default(3000),
});

export const config = configSchema.parse(process.env);

export type Config = z.infer<typeof configSchema>;