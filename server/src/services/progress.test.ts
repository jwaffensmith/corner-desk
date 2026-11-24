import { describe, it, expect } from "vitest";
import { nextAssessmentWeek, summarizeProgress } from "./progress.js";

const tracks = [
  { id: "js", slug: "js-ts", name: "JS", countsTowardStudy: true },
  { id: "ag", slug: "agentic", name: "Agentic", countsTowardStudy: false },
];
const now = new Date(2026, 10, 25, 12); // Wednesday, local time

describe("summarizeProgress", () => {
  const result = summarizeProgress({
    tracks,
    now,
    targetHours: 100,
    weeks: [{ completedAt: new Date() }, { completedAt: null }],
    assignments: [
      { trackId: "js", status: "DONE", actualMin: 45, completedAt: new Date(2026, 10, 24) },
      { trackId: "js", status: "DONE", actualMin: 30, completedAt: new Date(2026, 10, 17) },
      { trackId: "js", status: "TODO", actualMin: 15, completedAt: null },
      { trackId: "js", status: "SKIPPED", actualMin: null, completedAt: null },
      { trackId: "ag", status: "DONE", actualMin: 60, completedAt: new Date(2026, 10, 24) },
    ],
  });

  it("drops skipped assignments from the plan", () => {
    expect(result.assignments).toEqual({ planned: 4, done: 3, skipped: 1 });
    expect(result.tracks[0]).toMatchObject({ planned: 3, done: 2 });
  });

  it("keeps workplace minutes out of study hours", () => {
    expect(result.study).toEqual({ minutes: 90, targetMinutes: 6000 });
    expect(result.workplaceMinutes).toBe(60);
  });

  it("buckets study completions into Monday-start calendar weeks, oldest first", () => {
    expect(result.consistency).toHaveLength(12);
    expect(result.consistency.at(-1)).toEqual({ weekOf: "2026-11-23", minutes: 45, completed: 1 });
    expect(result.consistency.at(-2)).toEqual({ weekOf: "2026-11-16", minutes: 30, completed: 1 });
    expect(result.consistency.at(-3)).toMatchObject({ minutes: 0, completed: 0 });
  });

  it("counts completed weeks", () => {
    expect(result.weeks).toEqual({ total: 2, completed: 1 });
  });
});

describe("nextAssessmentWeek", () => {
  it("rounds up to the next multiple of the cadence", () => {
    expect(nextAssessmentWeek(1, 34, 4)).toBe(4);
    expect(nextAssessmentWeek(4, 34, 4)).toBe(4);
    expect(nextAssessmentWeek(5, 34, 4)).toBe(8);
  });

  it("falls back to the final week when the cadence overshoots", () => {
    expect(nextAssessmentWeek(33, 34, 4)).toBe(34);
  });
});
