import { Router } from "express";
import { LIMITS, todoCreateSchema, todoUpdateSchema } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import { fromDay } from "../lib/dates.js";
import { assertRoom } from "../lib/http.js";
import { validate } from "../lib/validate.js";
import { serializeTodo as serialize, updateTodo } from "../services/todos.js";

export const todosRouter = Router();

const RECENTLY_DONE = 50;

todosRouter.get("/", async (req, res) => {
  const { userId } = req;
  const [open, done] = await Promise.all([
    prisma.todo.findMany({
      where: { userId, completedAt: null },
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    }),
    prisma.todo.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      take: RECENTLY_DONE,
    }),
  ]);
  res.json([...open, ...done].map(serialize));
});

todosRouter.post("/", validate(todoCreateSchema), async (req, res) => {
  const { userId } = req;
  assertRoom(await prisma.todo.count({ where: { userId, completedAt: null } }), LIMITS.openTodos, "open to-dos");
  const { dueDate, ...rest } = req.body;
  const todo = await prisma.todo.create({ data: { ...rest, dueDate: dueDate ? fromDay(dueDate) : null, userId } });
  res.status(201).json(serialize(todo));
});

todosRouter.patch("/:id", validate(todoUpdateSchema), async (req, res) => {
  res.json(serialize(await updateTodo(req.userId, req.params.id, req.body)));
});

todosRouter.delete("/:id", async (req, res) => {
  await prisma.todo.delete({ where: { id: req.params.id, userId: req.userId } });
  res.status(204).end();
});
