import { describe, it, expect } from "vitest";
import { hasProgress, resolveCompletion } from "./assignments.js";

const now = new Date("2026-11-23T12:00:00Z");
const todo = { status: "TODO" as const, estimatedMin: 45, actualMin: null, completedAt: null };

describe("resolveCompletion", () => {
  it("stamps the time and fills actual minutes from the estimate on check-off", () => {
    expect(resolveCompletion(todo, { status: "DONE" }, now)).toEqual({ completedAt: now, actualMin: 45 });
  });

  it("keeps minutes already logged", () => {
    expect(resolveCompletion({ ...todo, actualMin: 30 }, { status: "DONE" }, now)).toEqual({ completedAt: now });
  });

  it("prefers minutes sent with the check-off", () => {
    expect(resolveCompletion(todo, { status: "DONE", actualMin: 60 }, now)).toEqual({ completedAt: now, actualMin: 60 });
  });

  it("clears the date and logged time when unchecked, and only the date when skipped", () => {
    const done = { ...todo, status: "DONE" as const, completedAt: now, actualMin: 45 };
    expect(resolveCompletion(done, { status: "TODO" }, now)).toEqual({ completedAt: null, actualMin: null });
    expect(resolveCompletion(done, { status: "SKIPPED" }, now)).toEqual({ completedAt: null });
  });

  it("leaves a finished assignment's date alone on unrelated edits", () => {
    const earlier = new Date("2026-11-01T00:00:00Z");
    const done = { ...todo, status: "DONE" as const, completedAt: earlier, actualMin: 45 };
    expect(resolveCompletion(done, {}, now)).toEqual({ completedAt: earlier });
  });
});

describe("hasProgress", () => {
  const blank = { status: "TODO" as const, actualMin: null, confidence: null, notes: null };

  it("is false for an untouched assignment, including blank notes", () => {
    expect(hasProgress(blank)).toBe(false);
    expect(hasProgress({ ...blank, notes: "  " })).toBe(false);
  });

  it("is true once anything is logged", () => {
    expect(hasProgress({ ...blank, status: "DONE" })).toBe(true);
    expect(hasProgress({ ...blank, actualMin: 10 })).toBe(true);
    expect(hasProgress({ ...blank, confidence: 3 })).toBe(true);
    expect(hasProgress({ ...blank, notes: "tricky" })).toBe(true);
  });
});
