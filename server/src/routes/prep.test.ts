import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db.js";
import { resetDb } from "../test/helpers.js";
import { seed } from "../../prisma/seed.js";

const app = createApp();
beforeEach(async () => {
  await resetDb();
  await seed();
});
afterAll(() => prisma.$disconnect());

const curriculum = {
  weeks: [1, 2, 3].map((number) => ({
    number,
    title: `Week ${number}`,
    milestone: number === 2 ? "First Easy solved unaided" : undefined,
    assignments: [
      { key: `w${number}-js`, track: "js-ts", title: `JS ${number}`, estimatedMin: 45 },
      { key: `w${number}-lc`, track: "leetcode", title: `LC ${number}`, estimatedMin: 45 },
      { key: `w${number}-ag`, track: "agentic", title: `Agentic ${number}`, estimatedMin: 30 },
    ],
  })),
};

async function importPlan() {
  const res = await request(app).post("/api/curriculum/import").send(curriculum);
  expect(res.status).toBe(200);
}

const byKey = (key: string) => prisma.assignment.findUniqueOrThrow({ where: { key } });
const weekNumbers = async () =>
  (await prisma.week.findMany({ orderBy: { number: "asc" } })).map((w) => w.title);

describe("curriculum import", () => {
  it("previews without writing on a dry run", async () => {
    const res = await request(app).post("/api/curriculum/import?dryRun=true").send(curriculum);
    expect(res.body.plan.assignments.create).toHaveLength(9);
    expect(await prisma.week.count()).toBe(0);
  });

  it("re-importing updates content without touching progress", async () => {
    await importPlan();
    const a = await byKey("w1-js");
    await request(app).patch(`/api/assignments/${a.id}`).send({ status: "DONE", notes: "solid", confidence: 4 });

    const revised = structuredClone(curriculum);
    revised.weeks[0].assignments[0].title = "JS 1, revised";
    revised.weeks[0].assignments.splice(1, 1);
    const res = await request(app).post("/api/curriculum/import").send(revised);

    expect(res.body.plan.assignments.remove).toEqual(["w1-lc"]);
    expect(await byKey("w1-js")).toMatchObject({
      title: "JS 1, revised", status: "DONE", notes: "solid", confidence: 4, actualMin: 45,
    });
    expect(await prisma.assignment.count()).toBe(8);
  });

  it("round-trips through export", async () => {
    await importPlan();
    const exported = (await request(app).get("/api/curriculum/export")).body;
    expect(exported.weeks).toHaveLength(3);
    expect(exported.weeks[0].assignments.map((a: { key: string }) => a.key)).toEqual(["w1-js", "w1-lc", "w1-ag"]);

    const res = await request(app).post("/api/curriculum/import?dryRun=true").send(exported);
    expect(res.body.plan.assignments).toMatchObject({ create: [], remove: [] });
  });

  it("restores progress from a backup export", async () => {
    await importPlan();
    const a = await byKey("w1-js");
    await request(app).patch(`/api/assignments/${a.id}`).send({ status: "DONE", notes: "solid", confidence: 4 });
    await request(app).post("/api/prep/advance").send({ carryOver: [] });
    const backup = (await request(app).get("/api/curriculum/export?progress=true")).body;

    await prisma.week.deleteMany();
    const res = await request(app).post("/api/curriculum/import").send(backup);

    expect(res.body.plan.restoresProgress).toBe(9);
    expect(await byKey("w1-js")).toMatchObject({ status: "DONE", notes: "solid", confidence: 4, actualMin: 45 });
    expect((await byKey("w1-js")).completedAt).not.toBeNull();
    expect((await request(app).get("/api/prep/current")).body.week.number).toBe(2);
  });

  it("returns field errors for an unknown track", async () => {
    const bad = { weeks: [{ number: 1, assignments: [{ key: "x", track: "nope", title: "X", estimatedMin: 10 }] }] };
    const res = await request(app).post("/api/curriculum/import").send(bad);
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ "weeks.0.assignments.0.track": 'Unknown track "nope"' });
  });
});

describe("weeks", () => {
  it("inserts a week at a position and renumbers the rest", async () => {
    await importPlan();
    const res = await request(app).post("/api/weeks").send({ number: 2, title: "Inserted" });
    expect(res.body.number).toBe(2);
    expect(await weekNumbers()).toEqual(["Week 1", "Inserted", "Week 2", "Week 3"]);
  });

  it("reorders weeks", async () => {
    await importPlan();
    const ids = (await prisma.week.findMany({ orderBy: { number: "asc" } })).map((w) => w.id);
    const res = await request(app).put("/api/weeks/order").send({ ids: [ids[2], ids[0], ids[1]] });
    expect(res.status).toBe(204);
    expect(await weekNumbers()).toEqual(["Week 3", "Week 1", "Week 2"]);
  });

  it("refuses to delete a week with logged progress unless forced", async () => {
    await importPlan();
    const a = await byKey("w2-js");
    await request(app).patch(`/api/assignments/${a.id}`).send({ actualMin: 20 });

    expect((await request(app).delete(`/api/weeks/${a.weekId}`)).status).toBe(409);
    expect((await request(app).delete(`/api/weeks/${a.weekId}?force=true`)).status).toBe(204);
    expect(await weekNumbers()).toEqual(["Week 1", "Week 3"]);
  });
});

describe("weekly flow", () => {
  it("shows the current week with this week's study minutes, excluding agentic", async () => {
    await importPlan();
    for (const key of ["w1-js", "w1-ag"]) {
      const a = await byKey(key);
      await request(app).patch(`/api/assignments/${a.id}`).send({ status: "DONE" });
    }

    const res = await request(app).get("/api/prep/current");
    expect(res.body.week.number).toBe(1);
    expect(res.body.studyMinutes).toBe(45);
    expect(res.body.nextAssessmentAfterWeek).toBe(3);
    expect(res.body.nextMilestone).toEqual({ number: 2, milestone: "First Easy solved unaided" });
  });

  it("advances and carries over only the chosen unfinished assignments", async () => {
    await importPlan();
    const lc = await byKey("w1-lc");
    const res = await request(app).post("/api/prep/advance").send({ carryOver: [lc.id] });
    expect(res.body).toEqual({ completedWeek: 1, currentWeek: 2 });

    const current = (await request(app).get("/api/prep/current")).body.week;
    expect(current.assignments.map((a: { key: string }) => a.key)).toEqual(["w2-js", "w2-lc", "w2-ag", "w1-lc"]);
    expect((await byKey("w1-js")).status).toBe("TODO");
  });

  it("rejects carrying over a finished assignment", async () => {
    await importPlan();
    const js = await byKey("w1-js");
    await request(app).patch(`/api/assignments/${js.id}`).send({ status: "DONE" });
    const res = await request(app).post("/api/prep/advance").send({ carryOver: [js.id] });
    expect(res.status).toBe(400);
    expect(await prisma.week.count({ where: { completedAt: { not: null } } })).toBe(0);
  });

  it("reports progress with workplace minutes kept separate", async () => {
    await importPlan();
    const ag = await byKey("w1-ag");
    await request(app).patch(`/api/assignments/${ag.id}`).send({ status: "DONE" });
    const skipped = await byKey("w3-lc");
    await request(app).patch(`/api/assignments/${skipped.id}`).send({ status: "SKIPPED" });

    const res = await request(app).get("/api/prep/progress");
    expect(res.body.assignments).toEqual({ planned: 8, done: 1, skipped: 1 });
    expect(res.body.study.minutes).toBe(0);
    expect(res.body.workplaceMinutes).toBe(30);
  });
});

describe("tracks", () => {
  it("seeds five tracks with agentic outside study hours", async () => {
    const res = await request(app).get("/api/tracks");
    expect(res.body.map((t: { slug: string }) => t.slug)).toEqual([
      "js-ts", "cs", "leetcode", "system-design", "agentic",
    ]);
    expect(res.body.at(-1)).toMatchObject({ countsTowardStudy: false, weeklyTargetMin: 0 });
  });

  it("refuses to delete a track that has assignments", async () => {
    await importPlan();
    const track = await prisma.track.findUniqueOrThrow({ where: { slug: "leetcode" } });
    expect((await request(app).delete(`/api/tracks/${track.id}`)).status).toBe(409);
  });
});
