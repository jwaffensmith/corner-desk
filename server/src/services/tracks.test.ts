import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "./tracks.js";

describe("slugify", () => {
  it("turns a name into lowercase words joined by hyphens", () => {
    expect(slugify("JavaScript & TypeScript")).toBe("javascript-typescript");
    expect(slugify("  Résumé writing!  ")).toBe("resume-writing");
  });

  it("falls back when the name has no letters or numbers to use", () => {
    expect(slugify("日本語")).toBe("track");
  });
});

describe("uniqueSlug", () => {
  it("numbers a slug that is already taken", () => {
    expect(uniqueSlug("Public speaking", ["cs"])).toBe("public-speaking");
    expect(uniqueSlug("Public speaking", ["public-speaking", "public-speaking-2"])).toBe("public-speaking-3");
  });
});
