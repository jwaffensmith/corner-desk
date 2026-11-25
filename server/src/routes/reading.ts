import { Router } from "express";
import {
  LIMITS, bookCreateSchema, bookNoteCreateSchema, bookNoteUpdateSchema, bookUpdateSchema,
} from "@cornerdesk/shared";
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { assertRoom } from "../lib/http.js";
import { validate } from "../lib/validate.js";

export const readingRouter = Router();

const include = { notes: { orderBy: { createdAt: "asc" } } } satisfies Prisma.BookInclude;

readingRouter.get("/books", async (req, res) => {
  res.json(await prisma.book.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" }, include }));
});

readingRouter.post("/books", validate(bookCreateSchema), async (req, res) => {
  const { userId } = req;
  assertRoom(await prisma.book.count({ where: { userId } }), LIMITS.books, "books");
  res.status(201).json(await prisma.book.create({ data: { ...req.body, userId }, include }));
});

readingRouter.patch("/books/:id", validate(bookUpdateSchema), async (req, res) => {
  res.json(await prisma.book.update({ where: { id: req.params.id, userId: req.userId }, data: req.body, include }));
});

readingRouter.delete("/books/:id", async (req, res) => {
  await prisma.book.delete({ where: { id: req.params.id, userId: req.userId } });
  res.status(204).end();
});

readingRouter.post("/books/:bookId/notes", validate(bookNoteCreateSchema), async (req, res) => {
  const { userId } = req;
  const book = await prisma.book.findUniqueOrThrow({
    where: { id: req.params.bookId, userId },
    select: { id: true, _count: { select: { notes: true } } },
  });
  assertRoom(book._count.notes, LIMITS.notesPerBook, "notes on a book");
  res.status(201).json(await prisma.bookNote.create({ data: { ...req.body, bookId: book.id, userId } }));
});

readingRouter.patch("/notes/:id", validate(bookNoteUpdateSchema), async (req, res) => {
  res.json(await prisma.bookNote.update({ where: { id: req.params.id, userId: req.userId }, data: req.body }));
});

readingRouter.delete("/notes/:id", async (req, res) => {
  await prisma.bookNote.delete({ where: { id: req.params.id, userId: req.userId } });
  res.status(204).end();
});
