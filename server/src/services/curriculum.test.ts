import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { LIMITS, curriculumSchema } from "@cornerdesk/shared";
import { planImport, type ExistingCurriculum } from "./curriculum.js";

const file = (weeks: { number: number; keys: string[]; track?: string }[]) =>
  curriculumSchema.parse({
    weeks: weeks.map((w) => ({
      number: w.number,
      assignments: w.keys.map((key) => ({ key, track: w.track ?? "js-ts", title: key, estimatedMin: 45 })),
    })),
  });

const existing = (assignments: ExistingCurriculum["assignments"], weekNumbers = [1, 2]): ExistingCurriculum => ({
  trackSlugs: new Set(["js-ts", "leetcode"]),
  weekNumbers,
  assignments,
});

const row = (key: string, weekNumber: number, extra: Partial<ExistingCurriculum["assignments"][number]> = {}) => ({
  key, weekNumber, isSupplementary: false, hasProgress: false, ...extra,
});

describe("planImport", () => {
  it("creates everything on a fresh import", () => {
    const plan = planImport(file([{ number: 1, keys: ["a", "b"] }]), existing([], []));
    expect(plan.weeks).toEqual({ create: [1], update: [] });
    expect(plan.assignments).toEqual({ create: ["a", "b"], update: [], remove: [], keep: [] });
  });

  it("updates matching keys and only removes untouched assignments the file dropped", () => {
    const plan = planImport(
      file([{ number: 1, keys: ["a"] }]),
      existing([row("a", 1), row("b", 1), row("c", 1, { hasProgress: true })]),
    );
    expect(plan.assignments).toEqual({ create: [], update: ["a"], remove: ["b"], keep: ["c"] });
  });

  it("leaves weeks the file does not mention and hand-added assignments alone", () => {
    const plan = planImport(
      file([{ number: 1, keys: ["a"] }]),
      existing([row("a", 1), row("x", 2), row("mine", 1, { isSupplementary: true })]),
    );
    expect(plan.assignments.remove).toEqual([]);
  });

  it("matches by key even when the assignment now lives in another week", () => {
    const plan = planImport(file([{ number: 1, keys: ["a"] }]), existing([row("a", 2)]));
    expect(plan.assignments).toMatchObject({ update: ["a"], remove: [] });
  });

  it("rejects unknown tracks", () => {
    expect(() => planImport(file([{ number: 1, keys: ["a"], track: "nope" }]), existing([], []))).toThrow(
      expect.objectContaining({ status: 400, fields: { "weeks.0.assignments.0.track": 'Unknown track "nope"' } }),
    );
  });

  it("creates tracks the file lists that are missing, and accepts assignments on them", () => {
    const withTracks = curriculumSchema.parse({
      tracks: [{ slug: "writing", name: "Writing" }, { slug: "js-ts", name: "JS" }],
      weeks: [{ number: 1, assignments: [{ key: "a", track: "writing", title: "A", estimatedMin: 45 }] }],
    });
    const plan = planImport(withTracks, existing([], []));
    expect(plan.tracks).toEqual({ create: ["writing"] });
    expect(plan.assignments.create).toEqual(["a"]);
  });

  it("rejects more tracks than an account can hold", () => {
    const tooMany = curriculumSchema.parse({
      tracks: Array.from({ length: LIMITS.tracks - 1 }, (_, i) => ({ slug: `t${i}`, name: `T${i}` })),
      weeks: [],
    });
    expect(() => planImport(tooMany, existing([], []))).toThrow(
      expect.objectContaining({ fields: { tracks: `You can have at most ${LIMITS.tracks} tracks` } }),
    );
  });

  it("rejects gaps in week numbers", () => {
    expect(() => planImport(file([{ number: 4, keys: [] }]), existing([]))).toThrow(
      expect.objectContaining({ fields: { weeks: "Week numbers must be contiguous; missing 3" } }),
    );
  });
});

describe("curriculumSchema", () => {
  it("rejects duplicate keys and week numbers", () => {
    const result = curriculumSchema.safeParse({
      weeks: [
        { number: 1, assignments: [{ key: "a", track: "js-ts", title: "A", estimatedMin: 45 }] },
        { number: 1, assignments: [{ key: "a", track: "js-ts", title: "A", estimatedMin: 45 }] },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toEqual(['Duplicate week 1', 'Duplicate key "a"']);
  });

  it("accepts the example file, which imports into an account with no tracks", () => {
    const path = new URL("../../../client/public/curriculum.example.json", import.meta.url);
    const example = curriculumSchema.parse(JSON.parse(readFileSync(path, "utf8")));
    const plan = planImport(example, { trackSlugs: new Set(), weekNumbers: [], assignments: [] });
    expect(plan.weeks.create).toEqual([1, 2]);
    expect(plan.assignments.create).toHaveLength(8);
  });

  it("rejects a track listed twice", () => {
    const result = curriculumSchema.safeParse({
      tracks: [{ slug: "writing", name: "Writing" }, { slug: "writing", name: "Writing again" }],
      weeks: [],
    });
    expect(result.error?.issues.map((i) => i.message)).toEqual(['Duplicate track "writing"']);
  });
});
