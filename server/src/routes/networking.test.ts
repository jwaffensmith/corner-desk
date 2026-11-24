import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "../db.js";
import { as, createUser, resetDb } from "../test/helpers.js";

const OWNER = "owner";
const OTHER = "other";
const api = as(OWNER);
beforeEach(async () => {
  await resetDb();
  await createUser(OWNER);
});
afterAll(() => prisma.$disconnect());

const meetup = { name: "React meetup", date: "2026-12-03", location: "Downtown library" };

describe("networking events", () => {
  it("starts with a goal of one event a month and no events", async () => {
    expect((await api.get("/api/networking")).body).toEqual({ eventsPerMonth: 1, events: [] });
  });

  it("tracks an event from sign-up to attendance", async () => {
    const created = await api.post("/api/networking/events").send(meetup);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...meetup, status: "REGISTERED" });

    const updated = await api.patch(`/api/networking/events/${created.body.id}`)
      .send({ status: "ATTENDED", notes: "Met two hiring managers" });
    expect(updated.body).toMatchObject({ date: "2026-12-03", status: "ATTENDED", notes: "Met two hiring managers" });
  });

  it("lists events newest first", async () => {
    for (const date of ["2026-10-08", "2026-12-03", "2026-11-12"]) {
      await api.post("/api/networking/events").send({ name: date, date });
    }
    const { events } = (await api.get("/api/networking")).body;
    expect(events.map((e: { date: string }) => e.date)).toEqual(["2026-12-03", "2026-11-12", "2026-10-08"]);
  });

  it("rejects an event without a real date or with a non-web link", async () => {
    const res = await api.post("/api/networking/events").send({ name: "X", date: "2026-02-30", url: "javascript:alert(1)" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields)).toEqual(["date", "url"]);
  });

  it("saves the monthly goal", async () => {
    await api.patch("/api/networking/settings").send({ eventsPerMonth: 2 });
    expect((await api.get("/api/networking")).body.eventsPerMonth).toBe(2);
    expect((await api.patch("/api/networking/settings").send({ eventsPerMonth: 0 })).status).toBe(400);
  });

  it("deletes an event", async () => {
    const { body } = await api.post("/api/networking/events").send(meetup);
    expect((await api.delete(`/api/networking/events/${body.id}`)).status).toBe(204);
    expect(await prisma.networkingEvent.count()).toBe(0);
  });

  it("keeps each account's events and goal separate", async () => {
    await createUser(OTHER);
    const other = as(OTHER);
    const { body } = await api.post("/api/networking/events").send(meetup);
    await api.patch("/api/networking/settings").send({ eventsPerMonth: 3 });

    expect((await other.get("/api/networking")).body).toEqual({ eventsPerMonth: 1, events: [] });
    expect((await other.patch(`/api/networking/events/${body.id}`).send({ name: "x" })).status).toBe(404);
    expect((await other.delete(`/api/networking/events/${body.id}`)).status).toBe(404);
    expect(await prisma.networkingEvent.count({ where: { userId: OWNER } })).toBe(1);
  });
});
