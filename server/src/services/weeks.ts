import { LIMITS, type WeekCreate } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { HttpError, assertRoom } from "../lib/http.js";
import { hasProgress } from "./assignments.js";

type Tx = Prisma.TransactionClient;

export const assignmentOrder = { orderBy: { sortOrder: "asc" } } as const;

export function findCurrentWeek(userId: string, tx: Tx = prisma) {
  return tx.week.findFirst({ where: { userId, completedAt: null }, orderBy: { number: "asc" } });
}

export async function nextSortOrder(tx: Tx, weekId: string): Promise<number> {
  const last = await tx.assignment.aggregate({ where: { weekId }, _max: { sortOrder: true } });
  return (last._max.sortOrder ?? -1) + 1;
}

// Week numbers are unique per user, so renumbering parks every row on a negative number first.
async function renumber(tx: Tx, orderedIds: string[]) {
  for (const [i, id] of orderedIds.entries()) {
    await tx.week.update({ where: { id }, data: { number: -(i + 1) } });
  }
  for (const [i, id] of orderedIds.entries()) {
    await tx.week.update({ where: { id }, data: { number: i + 1 } });
  }
}

async function orderedWeekIds(tx: Tx, userId: string): Promise<string[]> {
  const weeks = await tx.week.findMany({ where: { userId }, select: { id: true }, orderBy: { number: "asc" } });
  return weeks.map((w) => w.id);
}

export function createWeek(userId: string, { number, ...data }: WeekCreate) {
  return prisma.$transaction(async (tx) => {
    const ids = await orderedWeekIds(tx, userId);
    assertRoom(ids.length, LIMITS.weeks, "weeks");
    const week = await tx.week.create({ data: { ...data, userId, number: ids.length + 1 } });
    if (number !== undefined && number <= ids.length) {
      ids.splice(number - 1, 0, week.id);
      await renumber(tx, ids);
    }
    return tx.week.findUniqueOrThrow({ where: { id: week.id } });
  });
}

export function reorderWeeks(userId: string, ids: string[]) {
  return prisma.$transaction(async (tx) => {
    const existing = await orderedWeekIds(tx, userId);
    if (ids.length !== existing.length || !ids.every((id) => existing.includes(id))) {
      throw new HttpError(400, "ids must list every week exactly once");
    }
    await renumber(tx, ids);
  });
}

export function deleteWeek(userId: string, id: string, force: boolean) {
  return prisma.$transaction(async (tx) => {
    const week = await tx.week.findFirstOrThrow({ where: { id, userId }, include: { assignments: true } });
    const logged = week.assignments.filter(hasProgress).length;
    if (logged && !force) {
      throw new HttpError(409, `Week ${week.number} has ${logged} assignment(s) with logged progress`);
    }
    await tx.week.delete({ where: { id } });
    await renumber(tx, await orderedWeekIds(tx, userId));
  });
}

export function advanceWeek(userId: string, carryOver: string[]) {
  return prisma.$transaction(async (tx) => {
    const current = await findCurrentWeek(userId, tx);
    if (!current) throw new HttpError(409, "Every week is already complete");

    const next = await tx.week.findFirst({
      where: { userId, completedAt: null, number: { gt: current.number } },
      orderBy: { number: "asc" },
    });

    if (carryOver.length) {
      if (!next) throw new HttpError(409, "There is no next week to carry assignments into");
      const moving = await tx.assignment.findMany({
        where: { id: { in: carryOver }, weekId: current.id, status: "TODO" },
        ...assignmentOrder,
      });
      if (moving.length !== carryOver.length) {
        throw new HttpError(400, "Only unfinished assignments from the current week can be carried over");
      }
      let sortOrder = await nextSortOrder(tx, next.id);
      for (const a of moving) {
        await tx.assignment.update({ where: { id: a.id }, data: { weekId: next.id, sortOrder: sortOrder++ } });
      }
    }

    await tx.week.update({ where: { id: current.id }, data: { completedAt: new Date() } });
    return { completedWeek: current.number, currentWeek: next?.number ?? null };
  });
}
