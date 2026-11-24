import { randomUUID } from "node:crypto";
import { Router } from "express";
import { assignmentCreateSchema, assignmentUpdateSchema } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import { HttpError, isForced } from "../lib/http.js";
import { validate } from "../lib/validate.js";
import { hasProgress, resolveCompletion } from "../services/assignments.js";
import { nextSortOrder } from "../services/weeks.js";

export const assignmentsRouter = Router();

assignmentsRouter.get("/:id", async (req, res) => {
  res.json(await prisma.assignment.findUniqueOrThrow({ where: { id: req.params.id } }));
});

assignmentsRouter.post("/", validate(assignmentCreateSchema), async (req, res) => {
  const sortOrder = await nextSortOrder(prisma, req.body.weekId);
  const assignment = await prisma.assignment.create({
    data: { ...req.body, key: randomUUID(), sortOrder },
  });
  res.status(201).json(assignment);
});

assignmentsRouter.patch("/:id", validate(assignmentUpdateSchema), async (req, res) => {
  const existing = await prisma.assignment.findUniqueOrThrow({ where: { id: req.params.id } });
  const data = { ...req.body, ...resolveCompletion(existing, req.body, new Date()) };
  if (data.weekId && data.weekId !== existing.weekId && data.sortOrder === undefined) {
    data.sortOrder = await nextSortOrder(prisma, data.weekId);
  }
  res.json(await prisma.assignment.update({ where: { id: existing.id }, data }));
});

assignmentsRouter.delete("/:id", async (req, res) => {
  const existing = await prisma.assignment.findUniqueOrThrow({ where: { id: req.params.id } });
  if (hasProgress(existing) && !isForced(req.query)) {
    throw new HttpError(409, "Assignment has logged progress");
  }
  await prisma.assignment.delete({ where: { id: existing.id } });
  res.status(204).end();
});
