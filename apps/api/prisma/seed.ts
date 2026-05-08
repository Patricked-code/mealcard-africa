import bcrypt from 'bcryptjs';
import { AccountStatus, UserRole, WalletType } from '@prisma/client';
import { prisma } from '../src/db/prisma.js';

async function main() {
  const adminPassword = await bcrypt.hash('AdminPassword123!', 12);
  const companyPassword = await bcrypt.hash('CompanyPassword123!', 12);
  const employeePassword = await bcrypt.hash('EmployeePassword123!', 12);
  const merchantPassword = await bcrypt.hash('MerchantPassword123!', 12);

  const admin = await prisma.user.upsert({ where: { email: 'admin@mealcard.africa' }, update: {}, create: { email: 'admin@mealcard.africa', passwordHash: adminPassword, role: UserRole.ADMIN, status: AccountStatus.ACTIVE } });

  const company = await prisma.company.create({ data: { legalName: 'Demo Company SA', tradingName: 'Demo Company', country: 'CI', taxId: 'CI-DEMO-001', status: AccountStatus.ACTIVE } });
  await prisma.user.create({ data: { email: 'company@mealcard.africa', passwordHash: companyPassword, role: UserRole.COMPANY_ADMIN, companyId: company.id, status: AccountStatus.ACTIVE } });

  const employee = await prisma.employee.create({ data: { companyId: company.id, firstName: 'Eric', lastName: 'Demo', phone: '+2250700000000', email: 'employee@mealcard.africa', status: AccountStatus.ACTIVE, wallets: { create: { type: WalletType.EMPLOYEE, currency: 'XOF', balance: 50000 } } } });
  await prisma.user.create({ data: { email: 'employee@mealcard.africa', passwordHash: employeePassword, role: UserRole.EMPLOYEE, companyId: company.id, employeeId: employee.id, status: AccountStatus.ACTIVE } });

  const merchant = await prisma.merchant.create({ data: { legalName: 'Restaurant Demo SARL', tradingName: 'Chez Demo', country: 'CI', city: 'Abidjan', category: 'RESTAURANT', status: AccountStatus.ACTIVE, wallets: { create: { type: WalletType.MERCHANT, currency: 'XOF', balance: 0 } } } });
  await prisma.user.create({ data: { email: 'merchant@mealcard.africa', passwordHash: merchantPassword, role: UserRole.MERCHANT_ADMIN, merchantId: merchant.id, status: AccountStatus.ACTIVE } });

  await prisma.wallet.createMany({ data: [
    { type: WalletType.COMPANY_PREFUNDING, currency: 'XOF', balance: 1000000 },
    { type: WalletType.PLATFORM_REVENUE, currency: 'XOF', balance: 0 },
    { type: WalletType.SETTLEMENT_CLEARING, currency: 'XOF', balance: 0 }
  ], skipDuplicates: true });

  console.log({ admin: admin.email, company: company.legalName, employee: employee.email, merchant: merchant.tradingName });
}

main().finally(async () => prisma.$disconnect());
