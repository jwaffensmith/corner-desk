import { Router } from "express";
import { advanceSchema, settingsUpdateSchema } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import { validate } from "../lib/validate.js";
import { nextAssessmentWeek, summarizeProgress } from "../services/progress.js";
import { advanceWeek, assignmentOrder, findCurrentWeek } from "../services/weeks.js";

export const prepRouter = Router();

const getSettings = (userId: string) =>
  prisma.prepSettings.upsert({ where: { userId }, create: { userId }, update: {} });

prepRouter.get("/settings", async (req, res) => {
  res.json(await getSettings(req.userId));
});

prepRouter.patch("/settings", validate(settingsUpdateSchema), async (req, res) => {
  const { userId } = req;
  res.json(await prisma.prepSettings.upsert({
    where: { userId },
    create: { ...req.body, userId },
    update: req.body,
  }));
});

prepRouter.get("/current", async (req, res) => {
  const { userId } = req;
  const [settings, current, totalWeeks, tracks] = await Promise.all([
    getSettings(userId),
    findCurrentWeek(userId),
    prisma.week.count({ where: { userId } }),
    prisma.track.findMany({ where: { userId, countsTowardStudy: true }, select: { id: true } }),
  ]);
  if (!current) {
    res.json({ week: null, totalWeeks, settings });
    return;
  }

  const [week, upcoming] = await Promise.all([
    prisma.week.findUniqueOrThrow({ where: { id: current.id }, include: { assignments: assignmentOrder } }),
    prisma.week.findFirst({
      where: { userId, number: { gte: current.number }, milestone: { not: null } },
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
  res.json(await advanceWeek(req.userId, req.body.carryOver));
});

prepRouter.get("/progress", async (req, res) => {
  const { userId } = req;
  const [settings, tracks, assignments, weeks] = await Promise.all([
    getSettings(userId),
    prisma.track.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
    prisma.assignment.findMany({
      where: { userId },
      select: { trackId: true, status: true, actualMin: true, completedAt: true },
    }),
    prisma.week.findMany({ where: { userId }, select: { completedAt: true } }),
  ]);
  res.json(summarizeProgress({ tracks, assignments, weeks, targetHours: settings.targetHours, now: new Date() }));
});
