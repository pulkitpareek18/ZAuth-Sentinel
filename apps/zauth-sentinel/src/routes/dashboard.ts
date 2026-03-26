import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getDashboardStats } from "../services/dashboardService.js";
import { sendApiError } from "../utils/http.js";

export const dashboardRouter = Router();

dashboardRouter.get("/api/dashboard", requireAuth, async (_req, res) => {
  try {
    const stats = await getDashboardStats();
    res.status(200).json(stats);
  } catch {
    sendApiError(res, 500, "dashboard_fetch_failed", "Unable to load dashboard data.");
  }
});
