import { Router } from "express";
import { advanceSchema, settingsUpdateSchema } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import { validate } from "../lib/validate.js";
import { nextAssessmentWeek, summarizeProgress } from "../services/progress.js";
import { advanceWeek, assignmentOrder, findCurrentWeek } from "../services/weeks.js";

export const prepRouter = Router();

const getSettings = () => prisma.prepSettings.upsert({ where: { id: 1 }, create: {}, update: {} });

prepRouter.get("/settings", async (_req, res) => {
  res.json(await getSettings());
});

prepRouter.patch("/settings", validate(settingsUpdateSchema), async (req, res) => {
  res.json(await prisma.prepSettings.upsert({ where: { id: 1 }, create: req.body, update: req.body }));
});

prepRouter.get("/current", async (_req, res) => {
  const [settings, current, totalWeeks, tracks] = await Promise.all([
    getSettings(),
    findCurrentWeek(),
    prisma.week.count(),
    prisma.track.findMany({ where: { countsTowardStudy: true }, select: { id: true } }),
  ]);
  if (!current) {
    res.json({ week: null, totalWeeks, settings });
    return;
  }

  const [week, upcoming] = await Promise.all([
    prisma.week.findUniqueOrThrow({ where: { id: current.id }, include: { assignments: assignmentOrder } }),
    prisma.week.findFirst({
      where: { number: { gte: current.number }, milestone: { not: null } },
      orderBy: { number: "asc" },
      select: { number: true, milestone: true },
    }),
  ]);
  const studyTracks = new Set(tracks.map((t) => t.id));
  const studyMinutes = week.assignments
    .filter((a) => studyTracks.has(a.trackId))
    .reduce((sum, a) => sum + (a.actualMin ?? 0), 0);

  res.json({
    week,
    totalWeeks,
    settings,
    studyMinutes,
    nextAssessmentAfterWeek: nextAssessmentWeek(week.number, totalWeeks, settings.assessmentEvery),
    nextMilestone: upcoming,
  });
});

prepRouter.post("/advance", validate(advanceSchema), async (req, res) => {
  res.json(await advanceWeek(req.body.carryOver));
});

prepRouter.get("/progress", async (_req, res) => {
  const [settings, tracks, assignments, weeks] = await Promise.all([
    getSettings(),
    prisma.track.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.assignment.findMany({ select: { trackId: true, status: true, actualMin: true, completedAt: true } }),
    prisma.week.findMany({ select: { completedAt: true } }),
  ]);
  res.json(summarizeProgress({ tracks, assignments, weeks, targetHours: settings.targetHours, now: new Date() }));
});
