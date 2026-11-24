import { Router } from "express";
import { LIMITS, eventCreateSchema, eventUpdateSchema, networkingSettingsSchema } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import type { NetworkingEvent } from "../generated/prisma/client.js";
import { fromDay, toDay } from "../lib/dates.js";
import { assertRoom } from "../lib/http.js";
import { validate } from "../lib/validate.js";

export const networkingRouter = Router();

const serialize = (event: NetworkingEvent) => ({ ...event, date: toDay(event.date) });

networkingRouter.get("/", async (req, res) => {
  const { userId } = req;
  const [settings, events] = await Promise.all([
    prisma.networkingSettings.upsert({ where: { userId }, create: { userId }, update: {} }),
    prisma.networkingEvent.findMany({ where: { userId }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
  ]);
  res.json({ eventsPerMonth: settings.eventsPerMonth, events: events.map(serialize) });
});

networkingRouter.patch("/settings", validate(networkingSettingsSchema), async (req, res) => {
  const { userId } = req;
  const settings = await prisma.networkingSettings.upsert({
    where: { userId },
    create: { ...req.body, userId },
    update: req.body,
  });
  res.json({ eventsPerMonth: settings.eventsPerMonth });
});

networkingRouter.post("/events", validate(eventCreateSchema), async (req, res) => {
  const { userId } = req;
  assertRoom(await prisma.networkingEvent.count({ where: { userId } }), LIMITS.events, "events");
  const { date, ...rest } = req.body;
  const event = await prisma.networkingEvent.create({ data: { ...rest, date: fromDay(date), userId } });
  res.status(201).json(serialize(event));
});

networkingRouter.patch("/events/:id", validate(eventUpdateSchema), async (req, res) => {
  const { date, ...rest } = req.body;
  const event = await prisma.networkingEvent.update({
    where: { id: req.params.id, userId: req.userId },
    data: { ...rest, date: date && fromDay(date) },
  });
  res.json(serialize(event));
});

networkingRouter.delete("/events/:id", async (req, res) => {
  await prisma.networkingEvent.delete({ where: { id: req.params.id, userId: req.userId } });
  res.status(204).end();
});
