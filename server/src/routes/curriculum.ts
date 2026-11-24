import { Router } from "express";
import { curriculumSchema } from "@cornerdesk/shared";
import { validate } from "../lib/validate.js";
import { exportCurriculum, importCurriculum } from "../services/curriculum.js";

export const curriculumRouter = Router();

curriculumRouter.post("/import", validate(curriculumSchema), async (req, res) => {
  const dryRun = req.query["dryRun"] === "true";
  res.json({ dryRun, plan: await importCurriculum(req.body, dryRun) });
});

curriculumRouter.get("/export", async (_req, res) => {
  res.json(await exportCurriculum());
});
