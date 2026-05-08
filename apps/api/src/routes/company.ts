import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { AccountStatus, UserRole, WalletType } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { audit } from '../services/audit.js';
import { creditEmployeeWallet } from '../services/ledger.js';
import { ok } from '../utils/http.js';

export const companyRouter = Router();
companyRouter.use(requireAuth);

companyRouter.get('/dashboard', requireRole('COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const companyId = req.user!.companyId!;
    const [employees, transactions] = await Promise.all([
      prisma.employee.count({ where: { companyId } }),
      prisma.transaction.findMany({ where: { employee: { companyId } }, orderBy: { createdAt: 'desc' }, take: 20 })
    ]);
    res.json(ok({ employees, transactions }));
  } catch (e) { next(e); }
});

companyRouter.get('/employees', requireRole('COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const employees = await prisma.employee.findMany({ where: { companyId: req.user!.companyId! }, include: { wallets: true, users: true }, orderBy: { createdAt: 'desc' } });
    res.json(ok(employees));
  } catch (e) { next(e); }
});

const employeeSchema = z.object({ firstName: z.string().min(1), lastName: z.string().min(1), phone: z.string().min(6), email: z.string().email().optional() });

companyRouter.post('/employees', requireRole('COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const body = employeeSchema.parse(req.body);
    const employee = await prisma.employee.create({ data: { ...body, companyId: req.user!.companyId!, status: AccountStatus.ACTIVE, wallets: { create: { type: WalletType.EMPLOYEE, currency: 'XOF', balance: 0 } } }, include: { wallets: true } });
    await audit(req.user!.sub, 'CREATE_EMPLOYEE', 'Employee', employee.id, body);
    res.status(201).json(ok(employee));
  } catch (e) { next(e); }
});

companyRouter.post('/employees/:id/create-access', requireRole('COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const employee = await prisma.employee.findFirstOrThrow({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    const passwordHash = await bcrypt.hash(req.body.password || 'EmployeePassword123!', 12);
    const email = req.body.email || employee.email || `${employee.phone}@mealcard.local`;
    const user = await prisma.user.create({ data: { email, passwordHash, role: UserRole.EMPLOYEE, companyId: employee.companyId, employeeId: employee.id, status: AccountStatus.ACTIVE } });
    await audit(req.user!.sub, 'CREATE_EMPLOYEE_ACCESS', 'User', user.id);
    res.status(201).json(ok(user));
  } catch (e) { next(e); }
});

companyRouter.post('/employees/:id/credit', requireRole('COMPANY_ADMIN'), async (req, res, next) => {
  try {
    const body = z.object({ amount: z.number().int().positive() }).parse(req.body);
    const employee = await prisma.employee.findFirstOrThrow({ where: { id: req.params.id, companyId: req.user!.companyId! } });
    const transaction = await creditEmployeeWallet(employee.id, body.amount);
    await audit(req.user!.sub, 'CREDIT_EMPLOYEE', 'Employee', employee.id, body);
    res.json(ok(transaction));
  } catch (e) { next(e); }
});
