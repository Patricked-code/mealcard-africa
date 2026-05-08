import { Router } from 'express';
import { z } from 'zod';
import { WalletType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { executeMealPayment } from '../services/ledger.js';
import { audit } from '../services/audit.js';
import { ok } from '../utils/http.js';

export const employeeRouter = Router();
employeeRouter.use(requireAuth, requireRole('EMPLOYEE'));

employeeRouter.get('/wallet', async (req, res, next) => {
  try {
    const wallet = await prisma.wallet.findFirstOrThrow({ where: { employeeId: req.user!.employeeId!, type: WalletType.EMPLOYEE } });
    res.json(ok(wallet));
  } catch (e) { next(e); }
});

employeeRouter.get('/transactions', async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({ where: { employeeId: req.user!.employeeId! }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(ok(transactions));
  } catch (e) { next(e); }
});

employeeRouter.post('/payments/confirm', async (req, res, next) => {
  try {
    const body = z.object({ paymentRequestId: z.string().min(1) }).parse(req.body);
    const transaction = await executeMealPayment(req.user!.employeeId!, body.paymentRequestId);
    await audit(req.user!.sub, 'CONFIRM_MEAL_PAYMENT', 'Transaction', transaction.id, body);
    res.json(ok(transaction));
  } catch (e) { next(e); }
});
