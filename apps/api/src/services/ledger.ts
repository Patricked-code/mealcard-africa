import { LedgerEntryDirection, TransactionStatus, WalletType } from '@prisma/client';
import { nanoid } from 'nanoid';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

export async function getOrCreatePlatformWallet(type: WalletType, currency = env.DEFAULT_CURRENCY) {
  const existing = await prisma.wallet.findFirst({ where: { type, currency, employeeId: null, merchantId: null } });
  if (existing) return existing;
  return prisma.wallet.create({ data: { type, currency, balance: 0 } });
}

export async function creditEmployeeWallet(employeeId: string, amount: number, memo = 'Dotation repas entreprise') {
  if (amount <= 0) throw new HttpError(400, 'Montant invalide');
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findFirstOrThrow({ where: { employeeId, type: WalletType.EMPLOYEE } });
    const prefunding = await getOrCreatePlatformWallet(WalletType.COMPANY_PREFUNDING, wallet.currency);
    const transaction = await tx.transaction.create({ data: { reference: `LOAD-${nanoid(12)}`, employeeId, amount, currency: wallet.currency, status: TransactionStatus.SUCCESS } });
    await tx.ledgerEntry.createMany({ data: [
      { transactionId: transaction.id, walletId: prefunding.id, direction: LedgerEntryDirection.DEBIT, amount, currency: wallet.currency, memo },
      { transactionId: transaction.id, walletId: wallet.id, direction: LedgerEntryDirection.CREDIT, amount, currency: wallet.currency, memo }
    ]});
    await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
    await tx.wallet.update({ where: { id: prefunding.id }, data: { balance: { decrement: amount } } });
    return transaction;
  });
}

export async function executeMealPayment(employeeId: string, paymentRequestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.paymentRequest.findUnique({ where: { id: paymentRequestId }, include: { merchant: true } });
    if (!request) throw new HttpError(404, 'Demande de paiement introuvable');
    if (request.status !== TransactionStatus.PENDING) throw new HttpError(409, 'Demande déjà traitée');
    if (request.expiresAt < new Date()) throw new HttpError(410, 'Demande expirée');
    const employeeWallet = await tx.wallet.findFirstOrThrow({ where: { employeeId, type: WalletType.EMPLOYEE } });
    const merchantWallet = await tx.wallet.findFirstOrThrow({ where: { merchantId: request.merchantId, type: WalletType.MERCHANT } });
    if (employeeWallet.currency !== request.currency || merchantWallet.currency !== request.currency) throw new HttpError(400, 'Devise incompatible');
    if (employeeWallet.balance < request.amount) throw new HttpError(402, 'Solde insuffisant');
    const fee = Math.floor((request.amount * env.PLATFORM_FEE_BPS) / 10000);
    const merchantNet = request.amount - fee;
    const revenueWallet = await getOrCreatePlatformWallet(WalletType.PLATFORM_REVENUE, request.currency);
    const transaction = await tx.transaction.create({ data: { reference: `MEAL-${nanoid(12)}`, paymentRequestId, employeeId, merchantId: request.merchantId, amount: request.amount, platformFee: fee, currency: request.currency, status: TransactionStatus.SUCCESS } });
    await tx.ledgerEntry.createMany({ data: [
      { transactionId: transaction.id, walletId: employeeWallet.id, direction: LedgerEntryDirection.DEBIT, amount: request.amount, currency: request.currency, memo: 'Paiement repas' },
      { transactionId: transaction.id, walletId: merchantWallet.id, direction: LedgerEntryDirection.CREDIT, amount: merchantNet, currency: request.currency, memo: 'Encaissement marchand net' },
      { transactionId: transaction.id, walletId: revenueWallet.id, direction: LedgerEntryDirection.CREDIT, amount: fee, currency: request.currency, memo: 'Commission plateforme' }
    ]});
    await tx.wallet.update({ where: { id: employeeWallet.id }, data: { balance: { decrement: request.amount } } });
    await tx.wallet.update({ where: { id: merchantWallet.id }, data: { balance: { increment: merchantNet } } });
    await tx.wallet.update({ where: { id: revenueWallet.id }, data: { balance: { increment: fee } } });
    await tx.paymentRequest.update({ where: { id: paymentRequestId }, data: { status: TransactionStatus.SUCCESS } });
    return transaction;
  });
}
