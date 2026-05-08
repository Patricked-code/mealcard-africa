import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(20),
  JWT_EXPIRES_IN: z.string().default('1h'),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  PLATFORM_FEE_BPS: z.coerce.number().int().min(0).max(3000).default(100),
  DEFAULT_CURRENCY: z.string().default('XOF')
});

export const env = schema.parse(process.env);
