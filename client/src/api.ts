import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssignmentCreate, AssignmentStatus, AssignmentUpdate, BookCreate, BookNoteCreate, BookNoteUpdate, BookUpdate,
  EventCreate, EventStatus, EventUpdate, ProjectCreate, ProjectUpdate, Resource, TodoCreate, TodoUpdate, WeekCreate,
  WeekUpdate,
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

export interface NetworkingEvent {
  id: string;
  name: string;
  date: string;
  location: string | null;
  url: string | null;
  notes: string | null;
  status: EventStatus;
}

export interface Networking {
  eventsPerMonth: number;
  events: NetworkingEvent[];
}

export interface Todo {
  id: string;
  title: string;
  notes: string | null;
  category: string | null;
  dueDate: string | null;
  repeatsWeekly: boolean;
  completedAt: string | null;
  projectId: string | null;
}

export interface Project {
  id: string;
  name: string;
  liveUrl: string | null;
  repoUrl: string | null;
  notes: string | null;
  todos: Todo[];
}

export interface BookNote {
  id: string;
  bookId: string;
  text: string;
  location: string | null;
  isTakeaway: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string | null;
  notes: BookNote[];
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

export function errorMessage(err: unknown): string {
  const fields = err instanceof ApiError ? Object.values(err.fields ?? {}) : [];
  return fields.length ? fields.join(". ") : (err as Error).message;
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

export const useNetworking = () =>
  useQuery({ queryKey: ["networking"], queryFn: () => api<Networking>("/networking") });
export const useCreateEvent = () =>
  useApiMutation((body: EventCreate) => api<NetworkingEvent>("/networking/events", "POST", body));
export const useUpdateEvent = () =>
  useApiMutation(({ id, ...body }: EventUpdate & { id: string }) =>
    api<NetworkingEvent>(`/networking/events/${id}`, "PATCH", body));
export const useDeleteEvent = () => useApiMutation((id: string) => api(`/networking/events/${id}`, "DELETE"));
export const useUpdateNetworkingGoal = () =>
  useApiMutation((eventsPerMonth: number) => api("/networking/settings", "PATCH", { eventsPerMonth }));

export const useTodos = () => useQuery({ queryKey: ["todos"], queryFn: () => api<Todo[]>("/todos") });
export const useCreateTodo = () => useApiMutation((body: TodoCreate) => api<Todo>("/todos", "POST", body));
export const useDeleteTodo = () => useApiMutation((id: string) => api(`/todos/${id}`, "DELETE"));

export function useUpdateTodo() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: TodoUpdate & { id: string }) => api<Todo>(`/todos/${id}`, "PATCH", body),
    onMutate: async ({ id, completed }) => {
      if (completed === undefined) return;
      await Promise.all(["todos", "projects"].map((key) => client.cancelQueries({ queryKey: [key] })));
      const completedAt = completed ? new Date().toISOString() : null;
      const patch = (todos: Todo[]) => todos.map((t) => (t.id === id ? { ...t, completedAt } : t));
      client.setQueryData<Todo[]>(["todos"], (todos) => todos && patch(todos));
      client.setQueryData<Project[]>(["projects"], (projects) => projects?.map((p) => ({ ...p, todos: patch(p.todos) })));
    },
    onSettled: () => client.invalidateQueries(),
  });
}

export const useProjects = () => useQuery({ queryKey: ["projects"], queryFn: () => api<Project[]>("/projects") });
export const useCreateProject = () => useApiMutation((body: ProjectCreate) => api<Project>("/projects", "POST", body));
export const useUpdateProject = () =>
  useApiMutation(({ id, ...body }: ProjectUpdate & { id: string }) => api<Project>(`/projects/${id}`, "PATCH", body));
export const useDeleteProject = () => useApiMutation((id: string) => api(`/projects/${id}`, "DELETE"));

export const useBooks = () => useQuery({ queryKey: ["books"], queryFn: () => api<Book[]>("/reading/books") });
export const useCreateBook = () => useApiMutation((body: BookCreate) => api<Book>("/reading/books", "POST", body));
export const useUpdateBook = () =>
  useApiMutation(({ id, ...body }: BookUpdate & { id: string }) => api<Book>(`/reading/books/${id}`, "PATCH", body));
export const useDeleteBook = () => useApiMutation((id: string) => api(`/reading/books/${id}`, "DELETE"));

export const useCreateBookNote = () =>
  useApiMutation(({ bookId, ...body }: BookNoteCreate & { bookId: string }) =>
    api<BookNote>(`/reading/books/${bookId}/notes`, "POST", body));
export const useDeleteBookNote = () => useApiMutation((id: string) => api(`/reading/notes/${id}`, "DELETE"));

export function useUpdateBookNote() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: BookNoteUpdate & { id: string }) =>
      api<BookNote>(`/reading/notes/${id}`, "PATCH", body),
    onMutate: async ({ id, isTakeaway }) => {
      if (isTakeaway === undefined) return;
      await client.cancelQueries({ queryKey: ["books"] });
      client.setQueryData<Book[]>(["books"], (books) =>
        books?.map((b) => ({ ...b, notes: b.notes.map((n) => (n.id === id ? { ...n, isTakeaway } : n)) })));
    },
    onSettled: () => client.invalidateQueries(),
  });
}

export const formatMinutes = (min: number) =>
  min < 60 ? `${min} min` : `${Math.round((min / 60) * 10) / 10} h`;
