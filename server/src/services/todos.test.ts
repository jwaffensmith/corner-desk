import { describe, it, expect } from "vitest";
import { nextDue } from "./todos.js";

describe("nextDue", () => {
  it("moves a week on from the due date", () => {
    expect(nextDue("2026-11-27", "2026-11-27")).toBe("2026-12-04");
  });

  it("keeps the weekday when finished early", () => {
    expect(nextDue("2026-11-27", "2026-11-24")).toBe("2026-12-04");
  });

  it("skips past weeks when finished late", () => {
    expect(nextDue("2026-11-06", "2026-11-24")).toBe("2026-11-27");
    expect(nextDue("2026-11-17", "2026-11-24")).toBe("2026-12-01");
  });

  it("starts from today when there was no due date", () => {
    expect(nextDue(null, "2026-11-24")).toBe("2026-12-01");
  });

  it("crosses a year boundary", () => {
    expect(nextDue("2026-12-28", "2026-12-28")).toBe("2027-01-04");
  });
});
