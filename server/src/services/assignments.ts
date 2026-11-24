import type { AssignmentStatus, AssignmentUpdate } from "@cornerdesk/shared";

interface ExistingAssignment {
  status: AssignmentStatus;
  estimatedMin: number;
  actualMin: number | null;
  completedAt: Date | null;
}

export function hasProgress(a: {
  status: AssignmentStatus;
  actualMin: number | null;
  confidence: number | null;
  notes: string | null;
}): boolean {
  return a.status === "DONE" || a.actualMin !== null || a.confidence !== null || !!a.notes?.trim();
}

// Checking an assignment off records the estimate as time spent unless a time is
// already logged, so a one-click check-off still counts toward study hours. Unchecking
// takes that time back out.
export function resolveCompletion(
  existing: ExistingAssignment,
  input: Pick<AssignmentUpdate, "status" | "completedAt" | "actualMin" | "estimatedMin">,
  now: Date,
): { completedAt: Date | null; actualMin?: number | null } {
  const status = input.status ?? existing.status;
  if (status !== "DONE") {
    const unchecked = existing.status === "DONE" && status === "TODO" && input.actualMin === undefined;
    return unchecked ? { completedAt: null, actualMin: null } : { completedAt: null };
  }

  const completedAt = input.completedAt ?? existing.completedAt ?? now;
  if (input.actualMin !== undefined) return { completedAt, actualMin: input.actualMin };
  if (existing.status !== "DONE" && existing.actualMin === null) {
    return { completedAt, actualMin: input.estimatedMin ?? existing.estimatedMin };
  }
  return { completedAt };
}
