import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { signToken } from '../middleware/auth.js';
import { HttpError, ok } from '../utils/http.js';

export const authRouter = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw new HttpError(401, 'Identifiants invalides');
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) throw new HttpError(401, 'Identifiants invalides');
    if (user.status !== 'ACTIVE') throw new HttpError(403, 'Compte inactif');
    const token = signToken({ sub: user.id, role: user.role, companyId: user.companyId || undefined, employeeId: user.employeeId || undefined, merchantId: user.merchantId || undefined });
    res.json(ok({ token, user: { id: user.id, email: user.email, role: user.role, companyId: user.companyId, employeeId: user.employeeId, merchantId: user.merchantId } }));
  } catch (e) { next(e); }
});
