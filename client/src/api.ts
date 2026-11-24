import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssignmentCreate, AssignmentStatus, AssignmentUpdate, Resource, WeekCreate, WeekUpdate,
} from "@cornerdesk/shared";

export interface Track {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  weeklyTargetMin: number;
  countsTowardStudy: boolean;
}

export interface Assignment {
  id: string;
  weekId: string;
  trackId: string;
  title: string;
  description: string | null;
  objectives: string[];
  estimatedMin: number;
  resources: Resource[];
  isSupplementary: boolean;
  status: AssignmentStatus;
  completedAt: string | null;
  actualMin: number | null;
  confidence: number | null;
  notes: string | null;
}

export interface Week {
  id: string;
  number: number;
  title: string | null;
  milestone: string | null;
  notes: string | null;
  completedAt: string | null;
  assignments: Assignment[];
}

export interface Settings {
  targetHours: number;
  weeklyTargetMin: number;
  weeklyStretchMin: number;
  assessmentEvery: number;
}

export interface Current {
  week: Week | null;
  totalWeeks: number;
  settings: Settings;
  studyMinutes?: number;
  nextAssessmentAfterWeek?: number;
  nextMilestone?: { number: number; milestone: string } | null;
}

export interface Progress {
  weeks: { total: number; completed: number };
  assignments: { planned: number; done: number; skipped: number };
  study: { minutes: number; targetMinutes: number };
  workplaceMinutes: number;
  tracks: { id: string; name: string; countsTowardStudy: boolean; planned: number; done: number; minutes: number }[];
  consistency: { weekOf: string; minutes: number; completed: number }[];
}

export interface ImportResult {
  dryRun: boolean;
  plan: {
    weeks: { create: number[]; update: number[] };
    assignments: { create: string[]; update: string[]; remove: string[]; keep: string[] };
    settings: boolean;
    restoresProgress: number;
  };
}

export class ApiError extends Error {
  constructor(readonly status: number, message: string, readonly fields?: Record<string, string>) {
    super(message);
  }
}

export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  // The session ended; reloading lands on the sign-in screen.
  if (res.status === 401) window.location.reload();
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, json?.error?.message ?? "Something went wrong", json?.error?.fields);
  }
  return json as T;
}

export const useTracks = () => useQuery({ queryKey: ["tracks"], queryFn: () => api<Track[]>("/tracks"), staleTime: Infinity });
export const useCurrent = () => useQuery({ queryKey: ["current"], queryFn: () => api<Current>("/prep/current") });
export const useWeeks = () => useQuery({ queryKey: ["weeks"], queryFn: () => api<Week[]>("/weeks") });
export const useProgress = () => useQuery({ queryKey: ["progress"], queryFn: () => api<Progress>("/prep/progress") });

function useApiMutation<V, R = unknown>(fn: (vars: V) => Promise<R>) {
  const client = useQueryClient();
  return useMutation({ mutationFn: fn, onSettled: () => client.invalidateQueries() });
}

// Deletes that would lose logged progress come back as 409; retry with force once confirmed.
async function destroy(path: string): Promise<boolean> {
  try {
    await api(path, "DELETE");
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 409) throw err;
    if (!window.confirm(`${err.message}. Delete anyway?`)) return false;
    await api(`${path}?force=true`, "DELETE");
  }
  return true;
}

export function useUpdateAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AssignmentUpdate & { id: string }) =>
      api<Assignment>(`/assignments/${id}`, "PATCH", body),
    onMutate: async ({ id, status }) => {
      if (!status) return;
      await client.cancelQueries();
      const patch = (week: Week): Week => ({
        ...week,
        assignments: week.assignments.map((a) => (a.id === id ? { ...a, status } : a)),
      });
      client.setQueryData<Current>(["current"], (c) => (c?.week ? { ...c, week: patch(c.week) } : c));
      client.setQueryData<Week[]>(["weeks"], (weeks) => weeks?.map(patch));
    },
    onSettled: () => client.invalidateQueries(),
  });
}

export const useCreateAssignment = () =>
  useApiMutation((body: AssignmentCreate) => api<Assignment>("/assignments", "POST", body));
export const useDeleteAssignment = () => useApiMutation((id: string) => destroy(`/assignments/${id}`));
export const useReorderAssignments = () =>
  useApiMutation(({ weekId, ids }: { weekId: string; ids: string[] }) =>
    api(`/weeks/${weekId}/assignments/order`, "PUT", { ids }));

export const useCreateWeek = () => useApiMutation((body: WeekCreate) => api<Week>("/weeks", "POST", body));
export const useUpdateWeek = () =>
  useApiMutation(({ id, ...body }: WeekUpdate & { id: string }) => api<Week>(`/weeks/${id}`, "PATCH", body));
export const useDeleteWeek = () => useApiMutation((id: string) => destroy(`/weeks/${id}`));
export const useReorderWeeks = () => useApiMutation((ids: string[]) => api("/weeks/order", "PUT", { ids }));

export const useAdvance = () =>
  useApiMutation((carryOver: string[]) => api("/prep/advance", "POST", { carryOver }));
export const useImport = () =>
  useApiMutation(({ file, dryRun }: { file: unknown; dryRun: boolean }) =>
    api<ImportResult>(`/curriculum/import?dryRun=${dryRun}`, "POST", file));

export const formatMinutes = (min: number) =>
  min < 60 ? `${min} min` : `${Math.round((min / 60) * 10) / 10} h`;
