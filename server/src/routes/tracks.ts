import { Router } from "express";
import { trackCreateSchema, trackUpdateSchema } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import { HttpError } from "../lib/http.js";
import { validate } from "../lib/validate.js";

export const tracksRouter = Router();

tracksRouter.get("/", async (_req, res) => {
  res.json(await prisma.track.findMany({ orderBy: { sortOrder: "asc" } }));
});

tracksRouter.post("/", validate(trackCreateSchema), async (req, res) => {
  const sortOrder = req.body.sortOrder ?? (await prisma.track.count());
  res.status(201).json(await prisma.track.create({ data: { ...req.body, sortOrder } }));
});

tracksRouter.patch("/:id", validate(trackUpdateSchema), async (req, res) => {
  res.json(await prisma.track.update({ where: { id: req.params.id }, data: req.body }));
});

tracksRouter.delete("/:id", async (req, res) => {
  const count = await prisma.assignment.count({ where: { trackId: req.params.id } });
  if (count) throw new HttpError(409, `Track has ${count} assignment(s); move or delete them first`);
  await prisma.track.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
