import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { env } from './config/env.js';
import { HttpError } from './utils/http.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { companyRouter } from './routes/company.js';
import { employeeRouter } from './routes/employee.js';
import { merchantRouter } from './routes/merchant.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'mealcard-api' }));
app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/company', companyRouter);
app.use('/employee', employeeRouter);
app.use('/merchant', merchantRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) return res.status(400).json({ ok: false, error: 'Validation error', details: err.flatten() });
  if (err instanceof HttpError) return res.status(err.status).json({ ok: false, error: err.message, details: err.details });
  if (err instanceof Prisma.PrismaClientKnownRequestError) return res.status(400).json({ ok: false, error: 'Database error', code: err.code });
  console.error(err);
  return res.status(500).json({ ok: false, error: 'Internal server error' });
});

app.listen(env.PORT, () => console.log(`MealCard API running on :${env.PORT}`));
