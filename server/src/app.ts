import express from "express";
import { errorHandler, notFound } from "./middleware/error.js";
import { tracksRouter } from "./routes/tracks.js";
import { weeksRouter } from "./routes/weeks.js";
import { assignmentsRouter } from "./routes/assignments.js";
import { prepRouter } from "./routes/prep.js";
import { curriculumRouter } from "./routes/curriculum.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/tracks", tracksRouter);
  app.use("/api/weeks", weeksRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/prep", prepRouter);
  app.use("/api/curriculum", curriculumRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
