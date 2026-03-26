import { Router } from "express";
import { config } from "../config.js";
import { optionalAuth, csrfTokenForRequest } from "../middleware/auth.js";
import { assuranceBadgeLabel, acrRank } from "../utils/assurance.js";

export const sessionRouter = Router();

sessionRouter.get("/api/session", optionalAuth, (req, res) => {
  if (!req.sentinelUser || !req.assurance || !req.sentinelSession) {
    res.status(401).json({
      authenticated: false,
      login_url: "/login"
    });
    return;
  }

  const assuranceOk = acrRank(req.assurance.acr) >= acrRank(config.sentinelRequiredAcr);
  const csrfToken = csrfTokenForRequest(req);

  res.status(200).json({
    authenticated: true,
    user: {
      id: req.sentinelUser.id,
      subject_id: req.sentinelUser.subject_id,
      email: req.sentinelUser.email,
      display_name: req.sentinelUser.display_name,
      rank: req.sentinelUser.rank,
      unit: req.sentinelUser.unit,
      clearance_level: req.sentinelUser.clearance_level
    },
    assurance: {
      acr: req.assurance.acr,
      amr: req.assurance.amr,
      uid: req.assurance.uid,
      did: req.assurance.did,
      badge_label: assuranceBadgeLabel(req.assurance.acr),
      assurance_ok: assuranceOk,
      required_acr: config.sentinelRequiredAcr
    },
    csrf_token: csrfToken
  });
});
