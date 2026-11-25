import { z } from "zod";

export const assignmentStatusEnum = z.enum(["TODO", "DONE", "SKIPPED"]);
export type AssignmentStatus = z.infer<typeof assignmentStatusEnum>;

const nonEmpty = z.string().trim().min(1);
const optText = z.string().trim().nullish();
const minutes = z.coerce.number().int().min(0);
const rating = z.coerce.number().int().min(1).max(5);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens");

const day = z.iso.date();

export const LIMITS = {
  weeks: 104, assignmentsPerWeek: 50, tracks: 20, events: 500, openTodos: 300, projects: 50, books: 100, notesPerBook: 1000,
} as const;

export const resourceSchema = z.object({
  title: nonEmpty,
  url: z.url(),
});
export type Resource = z.infer<typeof resourceSchema>;

export const idListSchema = z.object({
  ids: z.array(nonEmpty).refine((ids) => new Set(ids).size === ids.length, "Duplicate ids"),
});

const trackFields = {
  name: nonEmpty,
  description: optText,
  weeklyTargetMin: minutes.optional(),
  countsTowardStudy: z.boolean().optional(),
};
export const trackCreateSchema = z.object({
  slug: slug.optional(),
  ...trackFields,
  sortOrder: z.coerce.number().int().optional(),
});
export const trackUpdateSchema = trackCreateSchema.partial();

export const settingsUpdateSchema = z.object({
  targetHours: z.coerce.number().int().min(1),
  weeklyTargetMin: minutes,
  weeklyStretchMin: minutes,
  assessmentEvery: z.coerce.number().int().min(1),
}).partial();

export const weekCreateSchema = z.object({
  number: z.coerce.number().int().min(1).optional(),
  title: optText,
  milestone: optText,
  notes: optText,
});
export const weekUpdateSchema = z.object({
  title: optText,
  milestone: optText,
  notes: optText,
  completed: z.boolean().optional(),
});

export const assignmentCreateSchema = z.object({
  weekId: nonEmpty,
  trackId: nonEmpty,
  title: nonEmpty,
  description: optText,
  objectives: z.array(nonEmpty).optional(),
  estimatedMin: minutes,
  resources: z.array(resourceSchema).optional(),
  isSupplementary: z.boolean().optional(),
});
export const assignmentUpdateSchema = assignmentCreateSchema.partial().extend({
  sortOrder: z.coerce.number().int().optional(),
  status: assignmentStatusEnum.optional(),
  completedAt: z.coerce.date().nullish(),
  actualMin: minutes.nullish(),
  confidence: rating.nullish(),
  notes: optText,
});

export const advanceSchema = z.object({
  carryOver: z.array(nonEmpty).default([]),
});

const progressSchema = z.object({
  status: assignmentStatusEnum,
  completedAt: z.coerce.date().nullish(),
  actualMin: minutes.nullish(),
  confidence: rating.nullish(),
  notes: optText,
});

export const curriculumSchema = z.object({
  settings: settingsUpdateSchema.optional(),
  tracks: z.array(z.object({ slug, ...trackFields })).max(LIMITS.tracks).optional(),
  weeks: z.array(z.object({
    number: z.number().int().min(1).max(LIMITS.weeks),
    title: optText,
    milestone: optText,
    notes: optText,
    completedAt: z.coerce.date().nullish(),
    assignments: z.array(z.object({
      key: nonEmpty,
      track: slug,
      title: nonEmpty,
      description: optText,
      objectives: z.array(nonEmpty).default([]),
      estimatedMin: z.number().int().min(0),
      resources: z.array(resourceSchema).default([]),
      isSupplementary: z.boolean().optional(),
      progress: progressSchema.optional(),
    })).max(LIMITS.assignmentsPerWeek).default([]),
  })).max(LIMITS.weeks),
}).superRefine((file, ctx) => {
  const slugs = new Set<string>();
  file.tracks?.forEach((track, t) => {
    if (slugs.has(track.slug)) {
      ctx.addIssue({ code: "custom", path: ["tracks", t, "slug"], message: `Duplicate track "${track.slug}"` });
    }
    slugs.add(track.slug);
  });
  const numbers = new Set<number>();
  const keys = new Set<string>();
  file.weeks.forEach((week, w) => {
    if (numbers.has(week.number)) {
      ctx.addIssue({ code: "custom", path: ["weeks", w, "number"], message: `Duplicate week ${week.number}` });
    }
    numbers.add(week.number);
    week.assignments.forEach((a, i) => {
      if (keys.has(a.key)) {
        ctx.addIssue({ code: "custom", path: ["weeks", w, "assignments", i, "key"], message: `Duplicate key "${a.key}"` });
      }
      keys.add(a.key);
    });
  });
});

export const eventStatusEnum = z.enum(["REGISTERED", "ATTENDED", "SKIPPED"]);
export type EventStatus = z.infer<typeof eventStatusEnum>;

export const eventCreateSchema = z.object({
  name: nonEmpty,
  date: day,
  location: optText,
  url: z.httpUrl().nullish(),
  notes: optText,
  status: eventStatusEnum.optional(),
});
export const eventUpdateSchema = eventCreateSchema.partial();

export const networkingSettingsSchema = z.object({
  eventsPerMonth: z.coerce.number().int().min(1).max(31),
});

export const todoCreateSchema = z.object({
  title: nonEmpty,
  notes: optText,
  category: optText,
  dueDate: day.nullish(),
  repeatsWeekly: z.boolean().optional(),
  projectId: nonEmpty.nullish(),
});
export const todoUpdateSchema = todoCreateSchema.partial().extend({
  completed: z.boolean().optional(),
});

export const projectCreateSchema = z.object({
  name: nonEmpty,
  liveUrl: z.httpUrl().nullish(),
  repoUrl: z.httpUrl().nullish(),
  notes: optText,
});
export const projectUpdateSchema = projectCreateSchema.partial();

export const bookCreateSchema = z.object({
  title: nonEmpty,
  author: optText,
});
export const bookUpdateSchema = bookCreateSchema.partial();

export const bookNoteCreateSchema = z.object({
  text: nonEmpty,
  location: optText,
  isTakeaway: z.boolean().optional(),
});
export const bookNoteUpdateSchema = bookNoteCreateSchema.partial();

export type TrackCreate = z.infer<typeof trackCreateSchema>;
export type TrackUpdate = z.infer<typeof trackUpdateSchema>;
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
export type WeekCreate = z.infer<typeof weekCreateSchema>;
export type WeekUpdate = z.infer<typeof weekUpdateSchema>;
export type AssignmentCreate = z.infer<typeof assignmentCreateSchema>;
export type AssignmentUpdate = z.infer<typeof assignmentUpdateSchema>;
export type Curriculum = z.infer<typeof curriculumSchema>;
export type EventCreate = z.infer<typeof eventCreateSchema>;
export type EventUpdate = z.infer<typeof eventUpdateSchema>;
export type TodoCreate = z.infer<typeof todoCreateSchema>;
export type TodoUpdate = z.infer<typeof todoUpdateSchema>;
export type ProjectCreate = z.infer<typeof projectCreateSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
export type BookCreate = z.infer<typeof bookCreateSchema>;
export type BookUpdate = z.infer<typeof bookUpdateSchema>;
export type BookNoteCreate = z.infer<typeof bookNoteCreateSchema>;
export type BookNoteUpdate = z.infer<typeof bookNoteUpdateSchema>;
