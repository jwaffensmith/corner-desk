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

const add = async (body: object) => (await api.post("/api/todos").send(body)).body;
const titles = async () => (await api.get("/api/todos")).body.map((t: { title: string }) => t.title);

describe("to-dos", () => {
  it("creates a to-do with only a title", async () => {
    const res = await api.post("/api/todos").send({ title: "Read a book on management" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ dueDate: null, category: null, repeatsWeekly: false, completedAt: null });
  });

  it("lists open to-dos by due date, undated last, then finished ones", async () => {
    await add({ title: "Undated" });
    await add({ title: "Later", dueDate: "2026-12-10" });
    await add({ title: "Sooner", dueDate: "2026-11-27" });
    const done = await add({ title: "Finished", dueDate: "2026-11-01" });
    await api.patch(`/api/todos/${done.id}`).send({ completed: true });

    expect(await titles()).toEqual(["Sooner", "Later", "Undated", "Finished"]);
  });

  it("completes and reopens a to-do", async () => {
    const todo = await add({ title: "Read a book on management", dueDate: "2026-12-10" });
    const done = await api.patch(`/api/todos/${todo.id}`).send({ completed: true });
    expect(done.body.completedAt).not.toBeNull();
    expect(done.body.dueDate).toBe("2026-12-10");

    const reopened = await api.patch(`/api/todos/${todo.id}`).send({ completed: false });
    expect(reopened.body.completedAt).toBeNull();
    expect(await prisma.todo.count()).toBe(1);
  });

  it("clears a due date", async () => {
    const todo = await add({ title: "X", dueDate: "2026-12-10" });
    expect((await api.patch(`/api/todos/${todo.id}`).send({ dueDate: null })).body.dueDate).toBeNull();
  });

  it("adds next week's copy when a weekly to-do is finished, once", async () => {
    const todo = await add({
      title: "Leadership reflection", category: "Leadership program", dueDate: "2099-01-02", repeatsWeekly: true,
    });
    const done = await api.patch(`/api/todos/${todo.id}`).send({ completed: true });
    expect(done.body).toMatchObject({ repeatsWeekly: false, dueDate: "2099-01-02" });

    await api.patch(`/api/todos/${todo.id}`).send({ completed: false });
    await api.patch(`/api/todos/${todo.id}`).send({ completed: true });

    const open = (await api.get("/api/todos")).body.filter((t: { completedAt: string | null }) => !t.completedAt);
    expect(open).toHaveLength(1);
    expect(open[0]).toMatchObject({
      title: "Leadership reflection", category: "Leadership program", dueDate: "2099-01-09", repeatsWeekly: true,
    });
  });

  it("rejects an empty title or an impossible date", async () => {
    const res = await api.post("/api/todos").send({ title: " ", dueDate: "2026-13-01" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields)).toEqual(["title", "dueDate"]);
  });

  it("deletes a to-do", async () => {
    const todo = await add({ title: "X" });
    expect((await api.delete(`/api/todos/${todo.id}`)).status).toBe(204);
    expect(await prisma.todo.count()).toBe(0);
  });

  it("keeps each account's to-dos separate", async () => {
    await createUser(OTHER);
    const other = as(OTHER);
    const todo = await add({ title: "Mine" });

    expect((await other.get("/api/todos")).body).toEqual([]);
    expect((await other.patch(`/api/todos/${todo.id}`).send({ completed: true })).status).toBe(404);
    expect((await other.delete(`/api/todos/${todo.id}`)).status).toBe(404);
    expect(await prisma.todo.count({ where: { userId: OWNER, completedAt: null } })).toBe(1);
  });
});
