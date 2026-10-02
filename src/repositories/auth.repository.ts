import { prisma } from "../config/prisma.js";

export const authRepository = {
  findOrCreateUser: async (email: string) => prisma.user.upsert({
    where: { email }, create: { email, verified: true }, update: { verified: true },
  }),
};
