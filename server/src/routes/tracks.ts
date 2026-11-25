import { Router } from "express";
import { LIMITS, trackCreateSchema, trackUpdateSchema } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import { HttpError, assertRoom } from "../lib/http.js";
import { validate } from "../lib/validate.js";
import { uniqueSlug } from "../services/tracks.js";

export const tracksRouter = Router();

tracksRouter.get("/", async (req, res) => {
  res.json(await prisma.track.findMany({ where: { userId: req.userId }, orderBy: { sortOrder: "asc" } }));
});

tracksRouter.post("/", validate(trackCreateSchema), async (req, res) => {
  const existing = await prisma.track.findMany({ where: { userId: req.userId }, select: { slug: true, sortOrder: true } });
  assertRoom(existing.length, LIMITS.tracks, "tracks");
  const slug = req.body.slug ?? uniqueSlug(req.body.name, existing.map((t) => t.slug));
  const sortOrder = req.body.sortOrder ?? Math.max(-1, ...existing.map((t) => t.sortOrder)) + 1;
  res.status(201).json(await prisma.track.create({ data: { ...req.body, slug, userId: req.userId, sortOrder } }));
});

tracksRouter.patch("/:id", validate(trackUpdateSchema), async (req, res) => {
  res.json(await prisma.track.update({ where: { id: req.params.id, userId: req.userId }, data: req.body }));
});

tracksRouter.delete("/:id", async (req, res) => {
  const where = { id: req.params.id, userId: req.userId };
  const count = await prisma.assignment.count({ where: { trackId: where.id, userId: where.userId } });
  if (count) throw new HttpError(409, `Track has ${count} assignment(s); move or delete them first`);
  await prisma.track.delete({ where });
  res.status(204).end();
});
