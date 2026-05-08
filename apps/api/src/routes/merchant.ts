import { Router } from 'express';
import { z } from 'zod';
import { TransactionStatus, WalletType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import { ok } from '../utils/http.js';

export const merchantRouter = Router();
merchantRouter.use(requireAuth, requireRole('MERCHANT_ADMIN', 'MERCHANT_CASHIER'));

merchantRouter.get('/wallet', async (req, res, next) => {
  try {
    const wallet = await prisma.wallet.findFirstOrThrow({ where: { merchantId: req.user!.merchantId!, type: WalletType.MERCHANT } });
    res.json(ok(wallet));
  } catch (e) { next(e); }
});

merchantRouter.post('/payment-requests', async (req, res, next) => {
  try {
    const body = z.object({ amount: z.number().int().positive(), currency: z.string().default('XOF') }).parse(req.body);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const request = await prisma.paymentRequest.create({
      data: {
        merchantId: req.user!.merchantId!,
        amount: body.amount,
        currency: body.currency,
        expiresAt,
        status: TransactionStatus.PENDING,
        qrPayload: JSON.stringify({ type: 'MEAL_PAYMENT', amount: body.amount, currency: body.currency })
      }
    });
    const updated = await prisma.paymentRequest.update({ where: { id: request.id }, data: { qrPayload: JSON.stringify({ type: 'MEAL_PAYMENT', paymentRequestId: request.id, merchantId: request.merchantId, amount: request.amount, currency: request.currency, expiresAt }) } });
    await audit(req.user!.sub, 'CREATE_PAYMENT_REQUEST', 'PaymentRequest', request.id, body);
    res.status(201).json(ok(updated));
  } catch (e) { next(e); }
});

merchantRouter.get('/transactions', async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({ where: { merchantId: req.user!.merchantId! }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(ok(transactions));
  } catch (e) { next(e); }
});
