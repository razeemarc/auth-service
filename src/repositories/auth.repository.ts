import { prisma } from "../config/prisma.js";

export const authRepository = {
  findChallenge: (email: string) => prisma.otpChallenge.findUnique({ where: { email } }),
  saveChallenge: (email: string, codeHash: string, expiresAt: Date) => prisma.otpChallenge.upsert({
    where: { email },
    create: { email, codeHash, expiresAt, attempts: 0, consumedAt: null, lastSentAt: new Date() },
    update: { codeHash, expiresAt, attempts: 0, consumedAt: null, lastSentAt: new Date() },
  }),
  incrementAttempts: (id: string) => prisma.otpChallenge.update({ where: { id }, data: { attempts: { increment: 1 } } }),
  consumeChallenge: (id: string) => prisma.otpChallenge.updateMany({
    where: { id, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  }),
  findOrCreateUser: async (email: string) => prisma.user.upsert({
    where: { email }, create: { email, verified: true }, update: { verified: true },
  }),
};
