import { Router } from "express";
import { requireAuth, requireCsrf } from "../middleware/auth.js";
import { listArmouryLog, createArmouryEntry } from "../services/armouryService.js";
import { sendApiError } from "../utils/http.js";

export const armouryRouter = Router();

armouryRouter.get("/api/armoury", requireAuth, async (req, res) => {
  const personnelId = req.query.personnel_id ? Number(req.query.personnel_id) : undefined;
  const action = String(req.query.action ?? "").trim() || undefined;
  const limit = Number(req.query.limit ?? 50);

  try {
    const entries = await listArmouryLog(personnelId, action, limit);
    res.status(200).json({ armoury: entries });
  } catch {
    sendApiError(res, 500, "armoury_fetch_failed", "Unable to fetch armoury log.");
  }
});

armouryRouter.post("/api/armoury", requireAuth, requireCsrf, async (req, res) => {
  const personnelId = Number(req.body.personnel_id);
  const weaponType = String(req.body.weapon_type ?? "").trim();
  const weaponSerial = String(req.body.weapon_serial ?? "").trim();
  const action = String(req.body.action ?? "").trim();
  const reason = req.body.reason ? String(req.body.reason).trim() : null;

  if (!Number.isFinite(personnelId) || !weaponType || !weaponSerial || !action) {
    sendApiError(res, 400, "invalid_input", "Personnel ID, weapon type, serial, and action are required.");
    return;
  }

  if (!["CHECKOUT", "RETURN"].includes(action)) {
    sendApiError(res, 400, "invalid_action", "Action must be CHECKOUT or RETURN.");
    return;
  }

  try {
    const entry = await createArmouryEntry(
      personnelId,
      weaponType,
      weaponSerial,
      action,
      reason,
      req.sentinelUser?.id ?? null,
      req.assurance?.acr ?? null
    );
    res.status(201).json(entry);
  } catch {
    sendApiError(res, 500, "armoury_create_failed", "Unable to record armoury transaction.");
  }
});
