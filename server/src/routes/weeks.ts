import { Router } from "express";
import { idListSchema, weekCreateSchema, weekUpdateSchema } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import { HttpError, isForced } from "../lib/http.js";
import { validate } from "../lib/validate.js";
import { assignmentOrder, createWeek, deleteWeek, reorderWeeks } from "../services/weeks.js";

export const weeksRouter = Router();

const withAssignments = { assignments: assignmentOrder };

weeksRouter.get("/", async (req, res) => {
  res.json(await prisma.week.findMany({
    where: { userId: req.userId },
    orderBy: { number: "asc" },
    include: withAssignments,
  }));
});

weeksRouter.get("/:id", async (req, res) => {
  res.json(await prisma.week.findFirstOrThrow({
    where: { id: req.params.id, userId: req.userId },
    include: withAssignments,
  }));
});

weeksRouter.post("/", validate(weekCreateSchema), async (req, res) => {
  res.status(201).json(await createWeek(req.userId, req.body));
});

weeksRouter.put("/order", validate(idListSchema), async (req, res) => {
  await reorderWeeks(req.userId, req.body.ids);
  res.status(204).end();
});

weeksRouter.patch("/:id", validate(weekUpdateSchema), async (req, res) => {
  const { completed, ...data } = req.body;
  const completedAt = completed === undefined ? undefined : completed ? new Date() : null;
  res.json(await prisma.week.update({
    where: { id: req.params.id, userId: req.userId },
    data: { ...data, completedAt },
  }));
});

weeksRouter.delete("/:id", async (req, res) => {
  await deleteWeek(req.userId, req.params.id, isForced(req.query));
  res.status(204).end();
});

weeksRouter.put("/:id/assignments/order", validate(idListSchema), async (req, res) => {
  const { ids } = req.body;
  await prisma.$transaction(async (tx) => {
    const existing = await tx.assignment.findMany({
      where: { weekId: req.params.id, userId: req.userId },
      select: { id: true },
    });
    if (ids.length !== existing.length || !existing.every((a) => ids.includes(a.id))) {
      throw new HttpError(400, "ids must list every assignment in the week exactly once");
    }
    for (const [sortOrder, id] of ids.entries()) {
      await tx.assignment.update({ where: { id }, data: { sortOrder } });
    }
  });
  res.status(204).end();
});
