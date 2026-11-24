import type { Curriculum, Resource } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import { HttpError } from "../lib/http.js";
import { hasProgress } from "./assignments.js";
import { nextSortOrder } from "./weeks.js";

export interface ExistingCurriculum {
  trackSlugs: Set<string>;
  weekNumbers: number[];
  assignments: { key: string; weekNumber: number; isSupplementary: boolean; hasProgress: boolean }[];
}

export interface ImportPlan {
  weeks: { create: number[]; update: number[] };
  assignments: { create: string[]; update: string[]; remove: string[]; keep: string[] };
  settings: boolean;
  restoresProgress: number;
}

// Each week in the file defines that week's planned content. Assignments are matched
// by key, and only content fields are ever written, so progress survives re-imports.
// A keyed assignment the file drops is removed only if it is untouched; weeks the file
// does not mention, and assignments added by hand, are left alone. The exception is a
// backup file: an assignment that carries a `progress` block has its progress restored.
export function planImport(file: Curriculum, existing: ExistingCurriculum): ImportPlan {
  const errors: Record<string, string> = {};
  file.weeks.forEach((week, w) =>
    week.assignments.forEach((a, i) => {
      if (!existing.trackSlugs.has(a.track)) {
        errors[`weeks.${w}.assignments.${i}.track`] = `Unknown track "${a.track}"`;
      }
    }),
  );

  const existingWeeks = new Set(existing.weekNumbers);
  const allNumbers = new Set([...existing.weekNumbers, ...file.weeks.map((w) => w.number)]);
  const missing = Array.from({ length: Math.max(0, ...allNumbers) }, (_, i) => i + 1)
    .filter((n) => !allNumbers.has(n));
  if (missing.length) errors["weeks"] = `Week numbers must be contiguous; missing ${missing.join(", ")}`;

  if (Object.keys(errors).length) throw new HttpError(400, "Curriculum has errors", errors);

  const fileKeys = new Set(file.weeks.flatMap((w) => w.assignments.map((a) => a.key)));
  const existingKeys = new Set(existing.assignments.map((a) => a.key));
  const fileWeeks = new Set(file.weeks.map((w) => w.number));
  const dropped = existing.assignments.filter(
    (a) => fileWeeks.has(a.weekNumber) && !a.isSupplementary && !fileKeys.has(a.key),
  );

  return {
    weeks: {
      create: file.weeks.map((w) => w.number).filter((n) => !existingWeeks.has(n)),
      update: file.weeks.map((w) => w.number).filter((n) => existingWeeks.has(n)),
    },
    assignments: {
      create: [...fileKeys].filter((k) => !existingKeys.has(k)),
      update: [...fileKeys].filter((k) => existingKeys.has(k)),
      remove: dropped.filter((a) => !a.hasProgress).map((a) => a.key),
      keep: dropped.filter((a) => a.hasProgress).map((a) => a.key),
    },
    settings: file.settings !== undefined,
    restoresProgress: file.weeks.flatMap((w) => w.assignments).filter((a) => a.progress).length,
  };
}

async function loadExisting(userId: string): Promise<ExistingCurriculum> {
  const [tracks, weeks, assignments] = await Promise.all([
    prisma.track.findMany({ where: { userId }, select: { slug: true } }),
    prisma.week.findMany({ where: { userId }, select: { number: true } }),
    prisma.assignment.findMany({ where: { userId }, include: { week: { select: { number: true } } } }),
  ]);
  return {
    trackSlugs: new Set(tracks.map((t) => t.slug)),
    weekNumbers: weeks.map((w) => w.number),
    assignments: assignments.map((a) => ({
      key: a.key,
      weekNumber: a.week.number,
      isSupplementary: a.isSupplementary,
      hasProgress: hasProgress(a),
    })),
  };
}

export async function importCurriculum(userId: string, file: Curriculum, dryRun: boolean): Promise<ImportPlan> {
  const plan = planImport(file, await loadExisting(userId));
  if (dryRun) return plan;

  await prisma.$transaction(
    async (tx) => {
      if (file.settings) {
        await tx.prepSettings.upsert({
          where: { userId },
          create: { ...file.settings, userId },
          update: file.settings,
        });
      }

      const trackIds = new Map(
        (await tx.track.findMany({ where: { userId }, select: { id: true, slug: true } })).map((t) => [t.slug, t.id]),
      );
      await tx.assignment.deleteMany({ where: { userId, key: { in: plan.assignments.remove } } });

      for (const { assignments, number, ...content } of file.weeks) {
        const week = await tx.week.upsert({
          where: { userId_number: { userId, number } },
          create: { userId, number, ...content },
          update: content,
        });
        let sortOrder = await nextSortOrder(tx, week.id);

        for (const { key, track, progress, ...fields } of assignments) {
          const data = { ...fields, ...progress, trackId: trackIds.get(track)! };
          await tx.assignment.upsert({
            where: { userId_key: { userId, key } },
            create: { ...data, userId, key, weekId: week.id, sortOrder: sortOrder++ },
            update: data,
          });
        }
      }
    },
    { timeout: 30_000 },
  );
  return plan;
}

export async function exportCurriculum(userId: string, withProgress: boolean): Promise<Curriculum> {
  const [settings, weeks] = await Promise.all([
    prisma.prepSettings.findUnique({ where: { userId } }),
    prisma.week.findMany({
      where: { userId },
      orderBy: { number: "asc" },
      include: { assignments: { orderBy: { sortOrder: "asc" }, include: { track: true } } },
    }),
  ]);
  return {
    settings: settings
      ? {
          targetHours: settings.targetHours,
          weeklyTargetMin: settings.weeklyTargetMin,
          weeklyStretchMin: settings.weeklyStretchMin,
          assessmentEvery: settings.assessmentEvery,
        }
      : undefined,
    weeks: weeks.map((w) => ({
      number: w.number,
      title: w.title,
      milestone: w.milestone,
      notes: w.notes,
      completedAt: withProgress ? w.completedAt : undefined,
      assignments: w.assignments.map((a) => ({
        key: a.key,
        track: a.track.slug,
        title: a.title,
        description: a.description,
        objectives: a.objectives,
        estimatedMin: a.estimatedMin,
        resources: a.resources as Resource[],
        ...(withProgress && {
          isSupplementary: a.isSupplementary,
          progress: {
            status: a.status,
            completedAt: a.completedAt,
            actualMin: a.actualMin,
            confidence: a.confidence,
            notes: a.notes,
          },
        }),
      })),
    })),
  };
}
