import { prisma } from '../db/prisma.js';

export async function audit(actorId: string | undefined, action: string, entity: string, entityId?: string, metadata?: unknown) {
  await prisma.auditLog.create({ data: { actorId, action, entity, entityId, metadata: metadata as object } });
}
