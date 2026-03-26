import { Router } from "express";
import { requireAuth, requireCsrf } from "../middleware/auth.js";
import { createDispatch, deleteDispatch, listDispatches, parseTags, updateDispatch } from "../services/dispatchService.js";
import { sendApiError } from "../utils/http.js";

export const dispatchesRouter = Router();

dispatchesRouter.get("/api/dispatches", requireAuth, async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const classification = String(req.query.classification ?? "").trim();
  const priority = String(req.query.priority ?? "").trim();

  try {
    const dispatches = await listDispatches(
      req.sentinelUser!.id,
      q || undefined,
      classification || undefined,
      priority || undefined
    );
    res.status(200).json({ dispatches });
  } catch {
    sendApiError(res, 500, "dispatches_fetch_failed", "Unable to fetch dispatches.");
  }
});

dispatchesRouter.post("/api/dispatches", requireAuth, requireCsrf, async (req, res) => {
  const title = String(req.body.title ?? "").trim();
  const content = String(req.body.content ?? "");
  const classification = String(req.body.classification ?? "CONFIDENTIAL").trim();
  const priority = String(req.body.priority ?? "ROUTINE").trim();
  const tags = parseTags(req.body.tags);

  if (!title) {
    sendApiError(res, 400, "title_required", "Please add a title for the dispatch.");
    return;
  }

  try {
    const dispatch = await createDispatch(req.sentinelUser!.id, title, content, classification, priority, tags);
    res.status(201).json(dispatch);
  } catch {
    sendApiError(res, 500, "dispatch_create_failed", "Unable to create dispatch.");
  }
});

dispatchesRouter.patch("/api/dispatches/:id", requireAuth, requireCsrf, async (req, res) => {
  const dispatchId = Number(req.params.id);
  if (!Number.isFinite(dispatchId)) {
    sendApiError(res, 400, "invalid_dispatch_id", "Invalid dispatch id.");
    return;
  }

  const title = req.body.title === undefined ? undefined : String(req.body.title).trim();
  const content = req.body.content === undefined ? undefined : String(req.body.content);
  const classification = req.body.classification === undefined ? undefined : String(req.body.classification).trim();
  const priority = req.body.priority === undefined ? undefined : String(req.body.priority).trim();
  const tags = req.body.tags === undefined ? undefined : parseTags(req.body.tags);

  if (title !== undefined && !title) {
    sendApiError(res, 400, "title_required", "Title cannot be empty.");
    return;
  }

  try {
    const dispatch = await updateDispatch(req.sentinelUser!.id, dispatchId, { title, content, classification, priority, tags });
    if (!dispatch) {
      sendApiError(res, 404, "dispatch_not_found", "Dispatch not found.");
      return;
    }
    res.status(200).json(dispatch);
  } catch {
    sendApiError(res, 500, "dispatch_update_failed", "Unable to update dispatch.");
  }
});

dispatchesRouter.delete("/api/dispatches/:id", requireAuth, requireCsrf, async (req, res) => {
  const dispatchId = Number(req.params.id);
  if (!Number.isFinite(dispatchId)) {
    sendApiError(res, 400, "invalid_dispatch_id", "Invalid dispatch id.");
    return;
  }

  try {
    const deleted = await deleteDispatch(req.sentinelUser!.id, dispatchId);
    if (!deleted) {
      sendApiError(res, 404, "dispatch_not_found", "Dispatch not found.");
      return;
    }
    res.status(200).json({ deleted: true });
  } catch {
    sendApiError(res, 500, "dispatch_delete_failed", "Unable to delete dispatch.");
  }
});
