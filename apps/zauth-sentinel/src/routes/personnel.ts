import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listPersonnel, getPersonnelById } from "../services/personnelService.js";
import { sendApiError } from "../utils/http.js";

export const personnelRouter = Router();

personnelRouter.get("/api/personnel", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const unit = String(req.query.unit ?? "").trim();
  const status = String(req.query.status ?? "").trim();

  try {
    const personnel = await listPersonnel(q || undefined, unit || undefined, status || undefined);
    res.status(200).json({ personnel });
  } catch {
    sendApiError(res, 500, "personnel_fetch_failed", "Unable to fetch personnel roster.");
  }
});

personnelRouter.get("/api/personnel/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    sendApiError(res, 400, "invalid_id", "Invalid personnel id.");
    return;
  }

  try {
    const person = await getPersonnelById(id);
    if (!person) {
      sendApiError(res, 404, "not_found", "Personnel not found.");
      return;
    }
    res.status(200).json(person);
  } catch {
    sendApiError(res, 500, "personnel_fetch_failed", "Unable to fetch personnel record.");
  }
});
