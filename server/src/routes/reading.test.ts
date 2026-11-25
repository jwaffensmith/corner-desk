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

const addBook = async (body: object) => (await api.post("/api/reading/books").send(body)).body;
const addNote = async (bookId: string, body: object) =>
  (await api.post(`/api/reading/books/${bookId}/notes`).send(body)).body;

describe("reading", () => {
  it("creates a book with only a title", async () => {
    const res = await api.post("/api/reading/books").send({ title: "Radical Candor" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Radical Candor", author: null, notes: [] });
  });

  it("lists books newest first, each with its notes in the order written", async () => {
    const first = await addBook({ title: "Radical Candor", author: "Kim Scott" });
    await addBook({ title: "The Manager's Path" });
    await addNote(first.id, { text: "Care personally", location: "Ch. 1" });
    await addNote(first.id, { text: "Challenge directly", isTakeaway: true });

    const { body } = await api.get("/api/reading/books");
    expect(body.map((b: { title: string }) => b.title)).toEqual(["The Manager's Path", "Radical Candor"]);
    expect(body[0].notes).toEqual([]);
    expect(body[1].notes).toMatchObject([
      { text: "Care personally", location: "Ch. 1", isTakeaway: false },
      { text: "Challenge directly", location: null, isTakeaway: true },
    ]);
  });

  it("updates a book and clears its author", async () => {
    const book = await addBook({ title: "Radical Candor", author: "Kim Scot" });
    const res = await api.patch(`/api/reading/books/${book.id}`).send({ title: "Radical Candor (2nd ed.)", author: null });
    expect(res.body).toMatchObject({ title: "Radical Candor (2nd ed.)", author: null });
  });

  it("rejects a book without a title and a note without text", async () => {
    const book = await addBook({ title: "Radical Candor" });
    expect((await api.post("/api/reading/books").send({ title: " " })).body.error.fields).toHaveProperty("title");
    const res = await api.post(`/api/reading/books/${book.id}/notes`).send({ text: " " });
    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty("text");
  });

  it("keeps a note's line breaks", async () => {
    const book = await addBook({ title: "Radical Candor" });
    const note = await addNote(book.id, { text: "First line\nSecond line\n" });
    expect(note.text).toBe("First line\nSecond line");
  });

  it("edits a note, marks it a takeaway, and deletes it", async () => {
    const book = await addBook({ title: "Radical Candor" });
    const note = await addNote(book.id, { text: "Praise in public", location: "p. 40" });

    const res = await api.patch(`/api/reading/notes/${note.id}`).send({ isTakeaway: true, location: null });
    expect(res.body).toMatchObject({ text: "Praise in public", location: null, isTakeaway: true });

    expect((await api.delete(`/api/reading/notes/${note.id}`)).status).toBe(204);
    expect((await api.get("/api/reading/books")).body[0].notes).toEqual([]);
  });

  it("deletes a book along with its notes, leaving the rest", async () => {
    const book = await addBook({ title: "Radical Candor" });
    const kept = await addBook({ title: "The Manager's Path" });
    await addNote(book.id, { text: "Gone" });
    await addNote(kept.id, { text: "Kept" });

    expect((await api.delete(`/api/reading/books/${book.id}`)).status).toBe(204);
    expect(await prisma.bookNote.findMany({ select: { text: true } })).toEqual([{ text: "Kept" }]);
  });

  it("answers 404 for a note on a book that doesn't exist", async () => {
    expect((await api.post("/api/reading/books/missing/notes").send({ text: "Lost" })).status).toBe(404);
  });

  it("keeps each account's books and notes separate", async () => {
    await createUser(OTHER);
    const other = as(OTHER);
    const book = await addBook({ title: "Mine" });
    const note = await addNote(book.id, { text: "Private" });

    expect((await other.get("/api/reading/books")).body).toEqual([]);
    expect((await other.patch(`/api/reading/books/${book.id}`).send({ title: "Taken" })).status).toBe(404);
    expect((await other.delete(`/api/reading/books/${book.id}`)).status).toBe(404);
    expect((await other.post(`/api/reading/books/${book.id}/notes`).send({ text: "Sneaky" })).status).toBe(404);
    expect((await other.patch(`/api/reading/notes/${note.id}`).send({ text: "Taken" })).status).toBe(404);
    expect((await other.delete(`/api/reading/notes/${note.id}`)).status).toBe(404);
    expect(await prisma.bookNote.findMany({ select: { text: true } })).toEqual([{ text: "Private" }]);
  });
});
