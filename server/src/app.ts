import express, { type Request, type RequestHandler } from "express";
import { errorHandler, notFound } from "./middleware/error.js";
import { tracksRouter } from "./routes/tracks.js";
import { weeksRouter } from "./routes/weeks.js";
import { assignmentsRouter } from "./routes/assignments.js";
import { prepRouter } from "./routes/prep.js";
import { curriculumRouter } from "./routes/curriculum.js";
import { networkingRouter } from "./routes/networking.js";
import { todosRouter } from "./routes/todos.js";
import { projectsRouter } from "./routes/projects.js";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export interface AppAuth {
  providers: string[];
  handler?: RequestHandler;
  userId(req: Request): Promise<string | null>;
}

export function createApp(auth: AppAuth) {
  const app = express();
  // Better Auth reads the raw body, so it has to come before the JSON parser.
  if (auth.handler) app.all("/api/auth/*splat", auth.handler);
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.get("/api/config", (_req, res) => {
    res.json({ providers: auth.providers });
  });

  app.use("/api", async (req, res, next) => {
    const userId = await auth.userId(req);
    if (!userId) {
      res.status(401).json({ error: { message: "Sign in to continue" } });
      return;
    }
    req.userId = userId;
    next();
  });

  app.use("/api/tracks", tracksRouter);
  app.use("/api/weeks", weeksRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/prep", prepRouter);
  app.use("/api/curriculum", curriculumRouter);
  app.use("/api/networking", networkingRouter);
  app.use("/api/todos", todosRouter);
  app.use("/api/projects", projectsRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
