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

const addProject = async (body: object) => (await api.post("/api/projects").send(body)).body;
const addTodo = async (body: object) => (await api.post("/api/todos").send(body)).body;

describe("projects", () => {
  it("creates a project with only a name", async () => {
    const res = await api.post("/api/projects").send({ name: "Recipe box" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Recipe box", liveUrl: null, repoUrl: null, notes: null, todos: [] });
  });

  it("lists projects in the order they were added, each with its to-dos", async () => {
    const first = await addProject({ name: "Recipe box", liveUrl: "https://recipes.example.com" });
    const second = await addProject({ name: "Trail map" });
    await addTodo({ title: "Undated", projectId: first.id });
    await addTodo({ title: "Dated", projectId: first.id, dueDate: "2026-12-10" });
    await addTodo({ title: "Unrelated" });

    const { body } = await api.get("/api/projects");
    expect(body.map((p: { name: string }) => p.name)).toEqual(["Recipe box", "Trail map"]);
    expect(body[0].todos).toMatchObject([{ title: "Dated", dueDate: "2026-12-10" }, { title: "Undated", dueDate: null }]);
    expect(body[1]).toMatchObject({ id: second.id, todos: [] });
  });

  it("updates a project and clears a link", async () => {
    const project = await addProject({ name: "Recipe box", repoUrl: "https://github.com/example/recipes" });
    const res = await api.patch(`/api/projects/${project.id}`).send({ name: "Recipe shelf", repoUrl: null });
    expect(res.body).toMatchObject({ name: "Recipe shelf", repoUrl: null });
  });

  it("rejects an empty name or a link that isn't a web address", async () => {
    const res = await api.post("/api/projects").send({ name: " ", liveUrl: "javascript:alert(1)" });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.fields)).toEqual(["name", "liveUrl"]);
  });

  it("moves a to-do onto a project and off again", async () => {
    const project = await addProject({ name: "Recipe box" });
    const todo = await addTodo({ title: "Write a README" });

    expect((await api.patch(`/api/todos/${todo.id}`).send({ projectId: project.id })).body.projectId).toBe(project.id);
    expect((await api.patch(`/api/todos/${todo.id}`).send({ projectId: null })).body.projectId).toBeNull();
  });

  it("keeps the project on the next copy of a weekly to-do", async () => {
    const project = await addProject({ name: "Recipe box" });
    const todo = await addTodo({ title: "Ship one fix", projectId: project.id, dueDate: "2099-01-02", repeatsWeekly: true });
    await api.patch(`/api/todos/${todo.id}`).send({ completed: true });

    const next = await prisma.todo.findFirstOrThrow({ where: { completedAt: null } });
    expect(next).toMatchObject({ title: "Ship one fix", projectId: project.id, repeatsWeekly: true });
  });

  it("deletes a project along with its to-dos, leaving the rest", async () => {
    const project = await addProject({ name: "Recipe box" });
    await addTodo({ title: "Write a README", projectId: project.id });
    await addTodo({ title: "Unrelated" });

    expect((await api.delete(`/api/projects/${project.id}`)).status).toBe(204);
    expect((await api.get("/api/todos")).body.map((t: { title: string }) => t.title)).toEqual(["Unrelated"]);
  });

  it("keeps each account's projects separate", async () => {
    await createUser(OTHER);
    const other = as(OTHER);
    const project = await addProject({ name: "Mine" });
    const theirs = (await other.post("/api/todos").send({ title: "Theirs" })).body;

    expect((await other.get("/api/projects")).body).toEqual([]);
    expect((await other.patch(`/api/projects/${project.id}`).send({ name: "Taken" })).status).toBe(404);
    expect((await other.delete(`/api/projects/${project.id}`)).status).toBe(404);
    expect((await other.post("/api/todos").send({ title: "Sneaky", projectId: project.id })).status).toBe(400);
    expect((await other.patch(`/api/todos/${theirs.id}`).send({ projectId: project.id })).status).toBe(400);
    expect(await prisma.todo.count({ where: { projectId: project.id } })).toBe(0);
  });
});
