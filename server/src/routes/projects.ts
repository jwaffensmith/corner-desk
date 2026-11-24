import { Router } from "express";
import { LIMITS, projectCreateSchema, projectUpdateSchema } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import type { Prisma, Project, Todo } from "../generated/prisma/client.js";
import { assertRoom } from "../lib/http.js";
import { validate } from "../lib/validate.js";
import { serializeTodo } from "../services/todos.js";

export const projectsRouter = Router();

const include = {
  todos: { orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }] },
} satisfies Prisma.ProjectInclude;

const serialize = (project: Project & { todos: Todo[] }) => ({ ...project, todos: project.todos.map(serializeTodo) });

projectsRouter.get("/", async (req, res) => {
  const projects = await prisma.project.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "asc" }, include });
  res.json(projects.map(serialize));
});

projectsRouter.post("/", validate(projectCreateSchema), async (req, res) => {
  const { userId } = req;
  assertRoom(await prisma.project.count({ where: { userId } }), LIMITS.projects, "projects");
  const project = await prisma.project.create({ data: { ...req.body, userId }, include });
  res.status(201).json(serialize(project));
});

projectsRouter.patch("/:id", validate(projectUpdateSchema), async (req, res) => {
  const project = await prisma.project.update({
    where: { id: req.params.id, userId: req.userId },
    data: req.body,
    include,
  });
  res.json(serialize(project));
});

projectsRouter.delete("/:id", async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id, userId: req.userId } });
  res.status(204).end();
});
