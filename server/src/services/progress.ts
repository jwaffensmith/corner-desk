import type { AssignmentStatus } from "@cornerdesk/shared";

interface TrackInput {
  id: string;
  slug: string;
  name: string;
  countsTowardStudy: boolean;
}

interface AssignmentInput {
  trackId: string;
  status: AssignmentStatus;
  actualMin: number | null;
  completedAt: Date | null;
}

export interface ProgressInput {
  tracks: TrackInput[];
  assignments: AssignmentInput[];
  weeks: { completedAt: Date | null }[];
  targetHours: number;
  now: Date;
  consistencyWeeks?: number;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function localDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Skipped assignments leave the plan rather than counting as unfinished.
export function summarizeProgress(input: ProgressInput) {
  const studyTracks = new Set(input.tracks.filter((t) => t.countsTowardStudy).map((t) => t.id));

  const tracks = input.tracks.map((t) => {
    const own = input.assignments.filter((a) => a.trackId === t.id);
    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      countsTowardStudy: t.countsTowardStudy,
      planned: own.filter((a) => a.status !== "SKIPPED").length,
      done: own.filter((a) => a.status === "DONE").length,
      minutes: own.reduce((sum, a) => sum + (a.actualMin ?? 0), 0),
    };
  });

  const sum = (pick: (t: (typeof tracks)[number]) => number, study?: boolean) =>
    tracks
      .filter((t) => study === undefined || t.countsTowardStudy === study)
      .reduce((total, t) => total + pick(t), 0);

  const weekCount = input.consistencyWeeks ?? 12;
  const thisWeek = startOfWeek(input.now);
  // Step back by days from local midnight rather than raw milliseconds so DST shifts don't skew buckets.
  const buckets = Array.from({ length: weekCount }, (_, i) => {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - 7 * (weekCount - 1 - i));
    return { weekOf: localDate(start), minutes: 0, completed: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.weekOf, i]));
  for (const a of input.assignments) {
    if (a.status !== "DONE" || !a.completedAt || !studyTracks.has(a.trackId)) continue;
    const i = index.get(localDate(startOfWeek(a.completedAt)));
    if (i === undefined) continue;
    buckets[i].minutes += a.actualMin ?? 0;
    buckets[i].completed += 1;
  }

  return {
    weeks: {
      total: input.weeks.length,
      completed: input.weeks.filter((w) => w.completedAt).length,
    },
    assignments: {
      planned: sum((t) => t.planned),
      done: sum((t) => t.done),
      skipped: input.assignments.filter((a) => a.status === "SKIPPED").length,
    },
    study: { minutes: sum((t) => t.minutes, true), targetMinutes: input.targetHours * 60 },
    workplaceMinutes: sum((t) => t.minutes, false),
    tracks,
    consistency: buckets,
  };
}

export function nextAssessmentWeek(current: number, totalWeeks: number, every: number): number {
  return Math.min(Math.ceil(current / every) * every, totalWeeks);
}
