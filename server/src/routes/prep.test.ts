import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import { prisma } from "../db.js";
import { provisionUser } from "../services/provision.js";
import { app, as, createUser, resetDb } from "../test/helpers.js";

const OWNER = "owner";
const OTHER = "other";
const api = as(OWNER);
beforeEach(async () => {
  await resetDb();
  await createUser(OWNER);
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

async function importPlan(client = api) {
  const res = await client.post("/api/curriculum/import").send(curriculum);
  expect(res.status).toBe(200);
}

const byKey = (key: string, userId = OWNER) =>
  prisma.assignment.findUniqueOrThrow({ where: { userId_key: { userId, key } } });
const weekNumbers = async () =>
  (await prisma.week.findMany({ orderBy: { number: "asc" } })).map((w) => w.title);

describe("curriculum import", () => {
  it("previews without writing on a dry run", async () => {
    const res = await api.post("/api/curriculum/import?dryRun=true").send(curriculum);
    expect(res.body.plan.assignments.create).toHaveLength(9);
    expect(await prisma.week.count()).toBe(0);
  });

  it("re-importing updates content without touching progress", async () => {
    await importPlan();
    const a = await byKey("w1-js");
    await api.patch(`/api/assignments/${a.id}`).send({ status: "DONE", notes: "solid", confidence: 4 });

    const revised = structuredClone(curriculum);
    revised.weeks[0].assignments[0].title = "JS 1, revised";
    revised.weeks[0].assignments.splice(1, 1);
    const res = await api.post("/api/curriculum/import").send(revised);

    expect(res.body.plan.assignments.remove).toEqual(["w1-lc"]);
    expect(await byKey("w1-js")).toMatchObject({
      title: "JS 1, revised", status: "DONE", notes: "solid", confidence: 4, actualMin: 45,
    });
    expect(await prisma.assignment.count()).toBe(8);
  });

  it("round-trips through export", async () => {
    await importPlan();
    const exported = (await api.get("/api/curriculum/export")).body;
    expect(exported.weeks).toHaveLength(3);
    expect(exported.weeks[0].assignments.map((a: { key: string }) => a.key)).toEqual(["w1-js", "w1-lc", "w1-ag"]);

    const res = await api.post("/api/curriculum/import?dryRun=true").send(exported);
    expect(res.body.plan.assignments).toMatchObject({ create: [], remove: [] });
  });

  it("restores progress from a backup export", async () => {
    await importPlan();
    const a = await byKey("w1-js");
    await api.patch(`/api/assignments/${a.id}`).send({ status: "DONE", notes: "solid", confidence: 4 });
    await api.post("/api/prep/advance").send({ carryOver: [] });
    const backup = (await api.get("/api/curriculum/export?progress=true")).body;

    await prisma.week.deleteMany();
    const res = await api.post("/api/curriculum/import").send(backup);

    expect(res.body.plan.restoresProgress).toBe(9);
    expect(await byKey("w1-js")).toMatchObject({ status: "DONE", notes: "solid", confidence: 4, actualMin: 45 });
    expect((await byKey("w1-js")).completedAt).not.toBeNull();
    expect((await api.get("/api/prep/current")).body.week.number).toBe(2);
  });

  it("returns field errors for an unknown track", async () => {
    const bad = { weeks: [{ number: 1, assignments: [{ key: "x", track: "nope", title: "X", estimatedMin: 10 }] }] };
    const res = await api.post("/api/curriculum/import").send(bad);
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toEqual({ "weeks.0.assignments.0.track": 'Unknown track "nope"' });
  });
});

describe("weeks", () => {
  it("inserts a week at a position and renumbers the rest", async () => {
    await importPlan();
    const res = await api.post("/api/weeks").send({ number: 2, title: "Inserted" });
    expect(res.body.number).toBe(2);
    expect(await weekNumbers()).toEqual(["Week 1", "Inserted", "Week 2", "Week 3"]);
  });

  it("reorders weeks", async () => {
    await importPlan();
    const ids = (await prisma.week.findMany({ orderBy: { number: "asc" } })).map((w) => w.id);
    const res = await api.put("/api/weeks/order").send({ ids: [ids[2], ids[0], ids[1]] });
    expect(res.status).toBe(204);
    expect(await weekNumbers()).toEqual(["Week 3", "Week 1", "Week 2"]);
  });

  it("refuses to delete a week with logged progress unless forced", async () => {
    await importPlan();
    const a = await byKey("w2-js");
    await api.patch(`/api/assignments/${a.id}`).send({ actualMin: 20 });

    expect((await api.delete(`/api/weeks/${a.weekId}`)).status).toBe(409);
    expect((await api.delete(`/api/weeks/${a.weekId}?force=true`)).status).toBe(204);
    expect(await weekNumbers()).toEqual(["Week 1", "Week 3"]);
  });
});

describe("weekly flow", () => {
  it("shows the current week with this week's study minutes, excluding agentic", async () => {
    await importPlan();
    for (const key of ["w1-js", "w1-ag"]) {
      const a = await byKey(key);
      await api.patch(`/api/assignments/${a.id}`).send({ status: "DONE" });
    }

    const res = await api.get("/api/prep/current");
    expect(res.body.week.number).toBe(1);
    expect(res.body.studyMinutes).toBe(45);
    expect(res.body.nextAssessmentAfterWeek).toBe(3);
    expect(res.body.nextMilestone).toEqual({ number: 2, milestone: "First Easy solved unaided" });
  });

  it("advances and carries over only the chosen unfinished assignments", async () => {
    await importPlan();
    const lc = await byKey("w1-lc");
    const res = await api.post("/api/prep/advance").send({ carryOver: [lc.id] });
    expect(res.body).toEqual({ completedWeek: 1, currentWeek: 2 });

    const current = (await api.get("/api/prep/current")).body.week;
    expect(current.assignments.map((a: { key: string }) => a.key)).toEqual(["w2-js", "w2-lc", "w2-ag", "w1-lc"]);
    expect((await byKey("w1-js")).status).toBe("TODO");
  });

  it("rejects carrying over a finished assignment", async () => {
    await importPlan();
    const js = await byKey("w1-js");
    await api.patch(`/api/assignments/${js.id}`).send({ status: "DONE" });
    const res = await api.post("/api/prep/advance").send({ carryOver: [js.id] });
    expect(res.status).toBe(400);
    expect(await prisma.week.count({ where: { completedAt: { not: null } } })).toBe(0);
  });

  it("reports progress with workplace minutes kept separate", async () => {
    await importPlan();
    const ag = await byKey("w1-ag");
    await api.patch(`/api/assignments/${ag.id}`).send({ status: "DONE" });
    const skipped = await byKey("w3-lc");
    await api.patch(`/api/assignments/${skipped.id}`).send({ status: "SKIPPED" });

    const res = await api.get("/api/prep/progress");
    expect(res.body.assignments).toEqual({ planned: 8, done: 1, skipped: 1 });
    expect(res.body.study.minutes).toBe(0);
    expect(res.body.workplaceMinutes).toBe(30);
  });
});

describe("tracks", () => {
  it("seeds five tracks with agentic outside study hours", async () => {
    const res = await api.get("/api/tracks");
    expect(res.body.map((t: { slug: string }) => t.slug)).toEqual([
      "js-ts", "cs", "leetcode", "system-design", "agentic",
    ]);
    expect(res.body.at(-1)).toMatchObject({ countsTowardStudy: false, weeklyTargetMin: 0 });
  });

  it("refuses to delete a track that has assignments", async () => {
    await importPlan();
    const track = await prisma.track.findUniqueOrThrow({ where: { userId_slug: { userId: OWNER, slug: "leetcode" } } });
    expect((await api.delete(`/api/tracks/${track.id}`)).status).toBe(409);
  });
});

describe("accounts", () => {
  it("rejects requests without a session", async () => {
    expect((await request(app).get("/api/weeks")).status).toBe(401);
    expect((await request(app).get("/api/health")).status).toBe(200);
  });

  it("gives a new account its own tracks and settings, once", async () => {
    await createUser(OTHER);
    await provisionUser(OTHER);
    expect(await prisma.track.count({ where: { userId: OTHER } })).toBe(5);
    expect((await as(OTHER).get("/api/prep/current")).body).toMatchObject({ week: null, totalWeeks: 0 });
  });

  it("keeps each account's curriculum separate", async () => {
    await createUser(OTHER);
    await importPlan();
    await importPlan(as(OTHER));
    const mine = await byKey("w1-js");
    await api.patch(`/api/assignments/${mine.id}`).send({ status: "DONE" });

    expect((await byKey("w1-js", OTHER)).status).toBe("TODO");
    expect((await as(OTHER).get("/api/prep/progress")).body.assignments.done).toBe(0);
    expect((await as(OTHER).get("/api/weeks")).body).toHaveLength(3);
    expect(await prisma.week.count()).toBe(6);
  });

  it("hides another account's records", async () => {
    await createUser(OTHER);
    await importPlan();
    const theirs = await byKey("w1-js");
    const track = await prisma.track.findFirstOrThrow({ where: { userId: OWNER } });
    const other = as(OTHER);

    expect((await other.get(`/api/assignments/${theirs.id}`)).status).toBe(404);
    expect((await other.patch(`/api/assignments/${theirs.id}`).send({ notes: "x" })).status).toBe(404);
    expect((await other.delete(`/api/assignments/${theirs.id}?force=true`)).status).toBe(404);
    expect((await other.get(`/api/weeks/${theirs.weekId}`)).status).toBe(404);
    expect((await other.patch(`/api/weeks/${theirs.weekId}`).send({ title: "x" })).status).toBe(404);
    expect((await other.delete(`/api/weeks/${theirs.weekId}?force=true`)).status).toBe(404);
    expect((await other.patch(`/api/tracks/${track.id}`).send({ name: "x" })).status).toBe(404);
    expect((await other.delete(`/api/tracks/${track.id}`)).status).toBe(404);
    expect((await other.put("/api/weeks/order").send({ ids: [theirs.weekId] })).status).toBe(400);
    expect((await other.put(`/api/weeks/${theirs.weekId}/assignments/order`).send({ ids: [theirs.id] })).status).toBe(400);
    expect(await prisma.assignment.count({ where: { userId: OWNER } })).toBe(9);
  });

  it("refuses to attach an assignment to another account's week or track", async () => {
    await createUser(OTHER);
    await importPlan();
    await importPlan(as(OTHER));
    const theirs = await byKey("w1-js");
    const mine = await byKey("w1-js", OTHER);
    const other = as(OTHER);

    const created = await other.post("/api/assignments")
      .send({ weekId: theirs.weekId, trackId: mine.trackId, title: "X", estimatedMin: 10 });
    expect(created.status).toBe(400);
    expect((await other.patch(`/api/assignments/${mine.id}`).send({ weekId: theirs.weekId })).status).toBe(400);
    expect((await other.patch(`/api/assignments/${mine.id}`).send({ trackId: theirs.trackId })).status).toBe(400);
    expect(await prisma.assignment.count({ where: { weekId: theirs.weekId } })).toBe(3);
  });
});
