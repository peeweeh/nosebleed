// Prisma client singleton — reuses across hot reloads in dev.

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient }

export const db: PrismaClient =
  globalForPrisma._prisma ?? new PrismaClient({ log: ['warn', 'error'] })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma._prisma = db
}
