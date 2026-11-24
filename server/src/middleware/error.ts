import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { HttpError } from "../lib/http.js";

const PRISMA_ERRORS: Record<string, [number, string]> = {
  P2025: [404, "Not found"],
  P2002: [409, "Already exists"],
  P2003: [400, "A referenced record does not exist"],
};

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: { message: "Not found" } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, fields: err.fields } });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && PRISMA_ERRORS[err.code]) {
    const [status, message] = PRISMA_ERRORS[err.code];
    res.status(status).json({ error: { message } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
}
