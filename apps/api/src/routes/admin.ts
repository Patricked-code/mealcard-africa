import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AccountStatus, UserRole, WalletType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import { ok } from '../utils/http.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/overview', async (_req, res, next) => {
  try {
    const [companies, employees, merchants, transactions] = await Promise.all([
      prisma.company.count(),
      prisma.employee.count(),
      prisma.merchant.count(),
      prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
    ]);
    res.json(ok({ companies, employees, merchants, transactions }));
  } catch (e) { next(e); }
});

adminRouter.post('/companies', async (req, res, next) => {
  try {
    const body = z.object({ legalName: z.string(), tradingName: z.string().optional(), country: z.string(), taxId: z.string().optional(), adminEmail: z.string().email(), adminPassword: z.string().min(8) }).parse(req.body);
    const passwordHash = await bcrypt.hash(body.adminPassword, 12);
    const company = await prisma.company.create({ data: { legalName: body.legalName, tradingName: body.tradingName, country: body.country, taxId: body.taxId, status: AccountStatus.ACTIVE, users: { create: { email: body.adminEmail, passwordHash, role: UserRole.COMPANY_ADMIN, status: AccountStatus.ACTIVE } } }, include: { users: true } });
    await audit(req.user!.sub, 'CREATE_COMPANY', 'Company', company.id, body);
    res.status(201).json(ok(company));
  } catch (e) { next(e); }
});

adminRouter.post('/merchants', async (req, res, next) => {
  try {
    const body = z.object({ legalName: z.string(), tradingName: z.string(), country: z.string(), city: z.string(), category: z.string(), adminEmail: z.string().email(), adminPassword: z.string().min(8) }).parse(req.body);
    const passwordHash = await bcrypt.hash(body.adminPassword, 12);
    const merchant = await prisma.merchant.create({ data: { legalName: body.legalName, tradingName: body.tradingName, country: body.country, city: body.city, category: body.category, status: AccountStatus.ACTIVE, wallets: { create: { type: WalletType.MERCHANT, currency: 'XOF', balance: 0 } }, users: { create: { email: body.adminEmail, passwordHash, role: UserRole.MERCHANT_ADMIN, status: AccountStatus.ACTIVE } } }, include: { users: true, wallets: true } });
    await audit(req.user!.sub, 'CREATE_MERCHANT', 'Merchant', merchant.id, body);
    res.status(201).json(ok(merchant));
  } catch (e) { next(e); }
});

adminRouter.get('/transactions', async (_req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({ include: { entries: true }, orderBy: { createdAt: 'desc' }, take: 100 });
    res.json(ok(transactions));
  } catch (e) { next(e); }
});
