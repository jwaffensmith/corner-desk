import type { TodoUpdate } from "@cornerdesk/shared";
import { prisma } from "../db.js";
import { fromDay, localDate, toDay } from "../lib/dates.js";

const addWeek = (day: string) => toDay(new Date(fromDay(day).getTime() + 7 * 86_400_000));

// The next occurrence keeps the weekday of the one just finished and always lands after today,
// so finishing late doesn't hand back a to-do that is already past due.
export function nextDue(due: string | null, today: string): string {
  let next = addWeek(due ?? today);
  while (next <= today) next = addWeek(next);
  return next;
}

export function updateTodo(userId: string, id: string, { completed, dueDate, ...rest }: TodoUpdate, now = new Date()) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.todo.findFirstOrThrow({ where: { id, userId } });
    const updated = await tx.todo.update({
      where: { id },
      data: {
        ...rest,
        dueDate: dueDate ? fromDay(dueDate) : dueDate,
        completedAt: completed === undefined ? undefined : completed ? (existing.completedAt ?? now) : null,
      },
    });
    if (!completed || existing.completedAt || !updated.repeatsWeekly) return updated;

    // The repeat moves to the new copy, so reopening and finishing this one again can't add another.
    const { title, notes, category } = updated;
    const due = nextDue(updated.dueDate && toDay(updated.dueDate), localDate(now));
    await tx.todo.create({ data: { userId, title, notes, category, dueDate: fromDay(due), repeatsWeekly: true } });
    return tx.todo.update({ where: { id }, data: { repeatsWeekly: false } });
  });
}
