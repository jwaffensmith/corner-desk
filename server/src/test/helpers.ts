import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { provisionUser } from "../services/provision.js";

export const app = createApp({
  providers: [],
  userId: async (req) => req.header("x-user") ?? null,
});

export const as = (userId: string) => request.agent(app).set("x-user", userId);

export async function resetDb() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User", "Verification" CASCADE;`);
}

export async function createUser(id: string) {
  await prisma.user.create({ data: { id, name: id, email: `${id}@example.com`, emailVerified: true } });
  await provisionUser(id);
}
