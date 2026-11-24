import { randomUUID } from "node:crypto";
import { Router } from "express";
import { LIMITS, assignmentCreateSchema, assignmentUpdateSchema } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import { HttpError, assertRoom, isForced } from "../lib/http.js";
import { validate } from "../lib/validate.js";
import { hasProgress, resolveCompletion } from "../services/assignments.js";
import { nextSortOrder } from "../services/weeks.js";

export const assignmentsRouter = Router();

const findOwn = (userId: string, id: string) =>
  prisma.assignment.findFirstOrThrow({ where: { id, userId } });

async function assertWeekHasRoom(userId: string, weekId: string) {
  const count = await prisma.assignment.count({ where: { weekId, userId } });
  assertRoom(count, LIMITS.assignmentsPerWeek, "assignments in a week");
}

assignmentsRouter.get("/:id", async (req, res) => {
  res.json(await findOwn(req.userId, req.params.id));
});

// The week and track must be the user's own: the foreign keys include userId.
assignmentsRouter.post("/", validate(assignmentCreateSchema), async (req, res) => {
  await assertWeekHasRoom(req.userId, req.body.weekId);
  const sortOrder = await nextSortOrder(prisma, req.body.weekId);
  const assignment = await prisma.assignment.create({
    data: { ...req.body, userId: req.userId, key: randomUUID(), sortOrder },
  });
  res.status(201).json(assignment);
});

assignmentsRouter.patch("/:id", validate(assignmentUpdateSchema), async (req, res) => {
  const existing = await findOwn(req.userId, req.params.id);
  const data = { ...req.body, ...resolveCompletion(existing, req.body, new Date()) };
  if (data.weekId && data.weekId !== existing.weekId) {
    await assertWeekHasRoom(req.userId, data.weekId);
    if (data.sortOrder === undefined) data.sortOrder = await nextSortOrder(prisma, data.weekId);
  }
  res.json(await prisma.assignment.update({ where: { id: existing.id }, data }));
});

assignmentsRouter.delete("/:id", async (req, res) => {
  const existing = await findOwn(req.userId, req.params.id);
  if (hasProgress(existing) && !isForced(req.query)) {
    throw new HttpError(409, "Assignment has logged progress");
  }
  await prisma.assignment.delete({ where: { id: existing.id } });
  res.status(204).end();
});
