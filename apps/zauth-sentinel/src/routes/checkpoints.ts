import { Router } from "express";
import { requireAuth, requireCsrf } from "../middleware/auth.js";
import { listCheckpoints, createCheckpointEntry } from "../services/checkpointService.js";
import { sendApiError } from "../utils/http.js";

export const checkpointsRouter = Router();

checkpointsRouter.get("/api/checkpoints", requireAuth, async (req, res) => {
  const personnelId = req.query.personnel_id ? Number(req.query.personnel_id) : undefined;
  const result = String(req.query.result ?? "").trim() || undefined;
  const limit = Number(req.query.limit ?? 50);

  try {
    const entries = await listCheckpoints(personnelId, result, limit);
    res.status(200).json({ checkpoints: entries });
  } catch {
    sendApiError(res, 500, "checkpoints_fetch_failed", "Unable to fetch checkpoint log.");
  }
});

checkpointsRouter.post("/api/checkpoints", requireAuth, requireCsrf, async (req, res) => {
  const personnelId = Number(req.body.personnel_id);
  const checkpointName = String(req.body.checkpoint_name ?? "").trim();
  const location = req.body.location ? String(req.body.location).trim() : null;
  const result = String(req.body.result ?? "PASS").trim();
  const notes = req.body.notes ? String(req.body.notes).trim() : null;

  if (!Number.isFinite(personnelId) || !checkpointName) {
    sendApiError(res, 400, "invalid_input", "Personnel ID and checkpoint name are required.");
    return;
  }

  if (!["PASS", "FAIL", "FLAGGED"].includes(result)) {
    sendApiError(res, 400, "invalid_result", "Result must be PASS, FAIL, or FLAGGED.");
    return;
  }

  try {
    const entry = await createCheckpointEntry(
      personnelId,
      checkpointName,
      location,
      result,
      notes,
      req.sentinelUser?.id ?? null,
      req.assurance?.acr ?? null
    );
    res.status(201).json(entry);
  } catch {
    sendApiError(res, 500, "checkpoint_create_failed", "Unable to record verification.");
  }
});
