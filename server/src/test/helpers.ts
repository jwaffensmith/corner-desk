import { prisma } from "../db.js";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Assignment", "Week", "Track", "PrepSettings" RESTART IDENTITY CASCADE;`,
  );
}
